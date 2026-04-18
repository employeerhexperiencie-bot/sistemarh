import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Upload, Search, Check, X, Loader2, Images, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ProfissionalAvatar } from '@/components/profissional/ProfissionalAvatar';
import { convertToEzpoint, validatePhotoFile } from '@/lib/ezpointPhoto';
import { fetchAllPaginated } from '@/lib/supabasePagination';
import { Layout } from '@/components/Layout';

interface Profissional {
  id: string;
  nome: string;
  matricula: string;
  cpf?: string | null;
  status: string;
  foto_url?: string | null;
  tenant_id: string;
}

interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
  matchedProfId?: string;
  uploaded?: boolean;
  error?: string;
}

const normalize = (s?: string | null) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

export default function UploadFotosLote() {
  const { toast } = useToast();
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchAllPaginated<Profissional>(() =>
        supabase.from('profissionais').select('id, nome, matricula, cpf, status, foto_url, tenant_id').order('nome')
      );
      setProfissionais(data || []);
      setLoading(false);
    })();
  }, []);

  const semFoto = useMemo(
    () => profissionais.filter((p) => p.status === 'ativo' && !p.foto_url),
    [profissionais],
  );
  const comFoto = useMemo(() => profissionais.filter((p) => p.foto_url), [profissionais]);

  const filteredSemFoto = useMemo(() => {
    if (!search) return semFoto;
    const n = normalize(search);
    return semFoto.filter((p) => normalize(p.nome).includes(n) || normalize(p.matricula).includes(n));
  }, [semFoto, search]);

  /** Tenta casar arquivo automaticamente por matrícula ou CPF no nome */
  const autoMatch = (filename: string): string | undefined => {
    const base = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const norm = normalize(base);
    // 1) match por matrícula exata
    let prof = profissionais.find((p) => normalize(p.matricula) === norm);
    if (prof) return prof.id;
    // 2) match por CPF (apenas dígitos)
    const digits = base.replace(/\D/g, '');
    if (digits.length >= 11) {
      const cpf11 = digits.slice(-11);
      prof = profissionais.find((p) => (p.cpf || '').replace(/\D/g, '') === cpf11);
      if (prof) return prof.id;
    }
    // 3) match por nome contido
    if (norm.length > 3) {
      prof = profissionais.find((p) => normalize(p.nome).includes(norm) || norm.includes(normalize(p.nome)));
      if (prof) return prof.id;
    }
    return undefined;
  };

  const handleFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const novos: PendingPhoto[] = [];
    arr.forEach((file) => {
      const v = validatePhotoFile(file);
      if (v.ok === false) {
        toast({ title: `Arquivo ignorado: ${file.name}`, description: v.error, variant: 'destructive' });
        return;
      }
      novos.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        matchedProfId: autoMatch(file.name),
      });
    });
    setPending((p) => [...p, ...novos]);
    const matched = novos.filter((n) => n.matchedProfId).length;
    toast({
      title: `${novos.length} foto(s) carregada(s)`,
      description: `${matched} vinculadas automaticamente. Vincule manualmente as restantes.`,
    });
  };

  const setMatch = (photoId: string, profId: string | undefined) => {
    setPending((p) => p.map((x) => (x.id === photoId ? { ...x, matchedProfId: profId } : x)));
  };

  const removePhoto = (photoId: string) => {
    setPending((p) => {
      const item = p.find((x) => x.id === photoId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return p.filter((x) => x.id !== photoId);
    });
  };

  const enviarTodas = async () => {
    const queue = pending.filter((p) => p.matchedProfId && !p.uploaded);
    if (queue.length === 0) {
      toast({ title: 'Nada para enviar', description: 'Vincule pelo menos uma foto a um profissional.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    setProgress(0);
    let done = 0;
    let okCount = 0;
    for (const item of queue) {
      try {
        const prof = profissionais.find((p) => p.id === item.matchedProfId)!;
        const ts = Date.now();
        const baseFolder = `${prof.tenant_id}/${prof.id}`;
        const ext = item.file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const originalPath = `${baseFolder}/original-${ts}.${ext}`;
        const ezpointPath = `${baseFolder}/ezpoint-${ts}.jpg`;

        const up1 = await supabase.storage
          .from('professional-photos')
          .upload(originalPath, item.file, { upsert: true, contentType: item.file.type });
        if (up1.error) throw up1.error;

        const ezBlob = await convertToEzpoint(item.file);
        const up2 = await supabase.storage
          .from('professional-photos')
          .upload(ezpointPath, ezBlob, { upsert: true, contentType: 'image/jpeg' });
        if (up2.error) throw up2.error;

        const { data: u1 } = supabase.storage.from('professional-photos').getPublicUrl(originalPath);
        const { data: u2 } = supabase.storage.from('professional-photos').getPublicUrl(ezpointPath);

        const { error: upErr } = await supabase
          .from('profissionais')
          .update({
            foto_url: u1.publicUrl,
            foto_ezpoint_url: u2.publicUrl,
            foto_atualizada_em: new Date().toISOString(),
          })
          .eq('id', prof.id);
        if (upErr) throw upErr;

        setPending((p) => p.map((x) => (x.id === item.id ? { ...x, uploaded: true } : x)));
        okCount++;
      } catch (err: any) {
        setPending((p) => p.map((x) => (x.id === item.id ? { ...x, error: err?.message || 'Falha' } : x)));
      } finally {
        done++;
        setProgress(Math.round((done / queue.length) * 100));
      }
    }
    setUploading(false);
    toast({
      title: 'Upload concluído',
      description: `${okCount}/${queue.length} foto(s) salva(s) com sucesso.`,
    });
    // Recarregar lista para refletir status
    const data = await fetchAllPaginated<Profissional>(() =>
      supabase.from('profissionais').select('id, nome, matricula, cpf, status, foto_url, tenant_id').order('nome')
    );
    setProfissionais(data || []);
  };

  const limparEnviadas = () => {
    setPending((p) => {
      p.filter((x) => x.uploaded).forEach((x) => URL.revokeObjectURL(x.previewUrl));
      return p.filter((x) => !x.uploaded);
    });
  };

  const totalVinculadas = pending.filter((p) => p.matchedProfId).length;
  const totalNaoVinculadas = pending.filter((p) => !p.matchedProfId).length;
  const totalEnviadas = pending.filter((p) => p.uploaded).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Images className="h-7 w-7" /> Upload de Fotos em Lote
          </h1>
          <p className="text-muted-foreground">
            Envie várias fotos de uma vez. O sistema tenta vincular automaticamente pelo nome do arquivo (matrícula, CPF ou nome).
          </p>
        </div>

        <Alert>
          <Wand2 className="h-4 w-4" />
          <AlertTitle>Como funciona</AlertTitle>
          <AlertDescription>
            Nomeie os arquivos como <strong>matrícula.jpg</strong> (ex: <code>1234.jpg</code>) ou <strong>cpf.jpg</strong> para vinculação automática.
            Cada foto gera automaticamente uma versão otimizada (320x240 JPG) para o ponto facial Ezpoint.
          </AlertDescription>
        </Alert>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{profissionais.length}</div>
              <p className="text-xs text-muted-foreground">Profissionais</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{comFoto.length}</div>
              <p className="text-xs text-muted-foreground">Com foto</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">{semFoto.length}</div>
              <p className="text-xs text-muted-foreground">Ativos sem foto</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{pending.length}</div>
              <p className="text-xs text-muted-foreground">Na fila</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar fotos</CardTitle>
            <CardDescription>JPG, PNG ou WEBP (máx 5MB cada)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            {pending.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">{totalVinculadas} vinculadas</Badge>
                {totalNaoVinculadas > 0 && <Badge variant="destructive">{totalNaoVinculadas} sem vínculo</Badge>}
                {totalEnviadas > 0 && <Badge className="bg-success text-success-foreground">{totalEnviadas} enviadas</Badge>}
              </div>
            )}
            {uploading && <Progress value={progress} />}
            <div className="flex flex-wrap gap-2">
              <Button onClick={enviarTodas} disabled={uploading || totalVinculadas === 0}>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Enviar {totalVinculadas} foto(s) vinculada(s)
              </Button>
              {totalEnviadas > 0 && (
                <Button variant="outline" onClick={limparEnviadas} disabled={uploading}>
                  Limpar enviadas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fila de fotos */}
        {pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fila de envio</CardTitle>
              <CardDescription>Vincule cada foto ao profissional correto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pending.map((photo) => {
                  const matched = profissionais.find((p) => p.id === photo.matchedProfId);
                  return (
                    <div
                      key={photo.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                    >
                      <img
                        src={photo.previewUrl}
                        alt={photo.file.name}
                        className="h-16 w-16 rounded object-cover border"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{photo.file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(photo.file.size / 1024).toFixed(0)} KB
                        </div>
                        <div className="mt-1">
                          {matched ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-success" />
                              <span className="font-medium">{matched.nome}</span>
                              <span className="text-muted-foreground">Mat. {matched.matricula}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-destructive">Não vinculada — selecione abaixo</span>
                          )}
                        </div>
                      </div>
                      <select
                        className="h-9 rounded-md border bg-background px-2 text-sm max-w-[220px]"
                        value={photo.matchedProfId || ''}
                        onChange={(e) => setMatch(photo.id, e.target.value || undefined)}
                        disabled={photo.uploaded}
                      >
                        <option value="">— escolher —</option>
                        {profissionais.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} ({p.matricula})
                          </option>
                        ))}
                      </select>
                      {photo.uploaded ? (
                        <Badge className="bg-success text-success-foreground">Enviada</Badge>
                      ) : photo.error ? (
                        <Badge variant="destructive">Erro</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => removePhoto(photo.id)} disabled={uploading}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profissionais sem foto */}
        <Card>
          <CardHeader>
            <CardTitle>Profissionais ativos sem foto ({semFoto.length})</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredSemFoto.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 border rounded">
                      <ProfissionalAvatar nome={p.nome} size="sm" />
                      <div className="text-sm min-w-0">
                        <div className="font-medium truncate">{p.nome}</div>
                        <div className="text-xs text-muted-foreground">Mat. {p.matricula}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
