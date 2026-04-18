import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Search, Check, X, Loader2, Images, Wand2, Link2, FileImage } from 'lucide-react';
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
  /** Origem do arquivo para exibir no card (nome local ou URL) */
  source: string;
}

const normalize = (s?: string | null) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

const formatCPF = (cpf?: string | null) => {
  if (!cpf) return '';
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

/**
 * Converte URLs do Google Drive em links de download direto.
 * Aceita formatos:
 *  - https://drive.google.com/file/d/FILE_ID/view?usp=...
 *  - https://drive.google.com/open?id=FILE_ID
 *  - https://drive.google.com/uc?id=FILE_ID
 *  - URLs diretas (devolve como está)
 */
function normalizeDriveUrl(url: string): string {
  const trimmed = url.trim();
  // /file/d/<id>/
  const m1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return `https://drive.google.com/uc?export=download&id=${m1[1]}`;
  // ?id=<id>
  const m2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return `https://drive.google.com/uc?export=download&id=${m2[1]}`;
  return trimmed;
}

export default function UploadFotosLote() {
  const { toast } = useToast();
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlsTexto, setUrlsTexto] = useState('');
  const [importandoUrls, setImportandoUrls] = useState(false);

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

  /** Tenta casar arquivo automaticamente por matrícula, CPF ou nome */
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
        source: file.name,
      });
    });
    setPending((p) => [...p, ...novos]);
    const matched = novos.filter((n) => n.matchedProfId).length;
    toast({
      title: `${novos.length} foto(s) carregada(s)`,
      description: `${matched} vinculadas automaticamente. Vincule manualmente as restantes.`,
    });
  };

  /** Importa fotos a partir de uma lista de URLs (Google Drive, Forms, links diretos) */
  const importarUrls = async () => {
    const linhas = urlsTexto
      .split(/[\n,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http'));
    if (linhas.length === 0) {
      toast({ title: 'Nenhuma URL válida', description: 'Cole pelo menos uma URL.', variant: 'destructive' });
      return;
    }
    setImportandoUrls(true);
    let ok = 0;
    let fail = 0;
    const novos: PendingPhoto[] = [];

    for (const raw of linhas) {
      try {
        const url = normalizeDriveUrl(raw);
        const resp = await fetch(url, { mode: 'cors' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        if (!/^image\/(jpeg|png|webp)/.test(blob.type)) {
          // Drive às vezes devolve text/html quando o arquivo é grande — orienta o usuário
          throw new Error('Conteúdo não é imagem (verifique permissão pública do link).');
        }
        // Tenta extrair um identificador útil do final da URL para auto-match
        const guessName = decodeURIComponent(raw.split('/').pop() || 'foto.jpg');
        const file = new File([blob], guessName, { type: blob.type });
        novos.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
          matchedProfId: autoMatch(guessName),
          source: raw,
        });
        ok++;
      } catch (err: any) {
        fail++;
        console.error('Falha ao importar URL', raw, err);
      }
    }
    setPending((p) => [...p, ...novos]);
    setUrlsTexto('');
    setImportandoUrls(false);
    toast({
      title: `${ok} foto(s) importada(s)`,
      description: fail > 0 ? `${fail} falharam (link sem permissão pública ou bloqueado por CORS).` : 'Vincule cada foto ao profissional.',
      variant: fail > 0 && ok === 0 ? 'destructive' : 'default',
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
            Visual estilo Google Drive — envie várias fotos ao mesmo tempo. O sistema vincula automaticamente pela matrícula, CPF ou nome no arquivo.
          </p>
        </div>

        <Alert>
          <Wand2 className="h-4 w-4" />
          <AlertTitle>Como funciona</AlertTitle>
          <AlertDescription>
            <strong>Opção 1:</strong> Selecione vários arquivos do seu computador. Para vinculação automática, nomeie como <code>matricula.jpg</code>, <code>cpf.jpg</code> ou contendo o nome do profissional.<br/>
            <strong>Opção 2:</strong> Cole links públicos do Google Drive ou de respostas do Google Forms. O sistema baixa e converte automaticamente para o padrão Ezpoint (320x240 JPG).
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

        {/* Upload com tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar fotos</CardTitle>
            <CardDescription>JPG, PNG ou WEBP (máx 5MB cada)</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="arquivo">
              <TabsList className="grid grid-cols-2 w-full sm:w-[400px]">
                <TabsTrigger value="arquivo">
                  <FileImage className="h-4 w-4 mr-2" /> Do computador
                </TabsTrigger>
                <TabsTrigger value="url">
                  <Link2 className="h-4 w-4 mr-2" /> Links (Drive/Forms)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="arquivo" className="pt-4">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Selecione múltiplos arquivos. Nomeie pelo CPF ou matrícula para vinculação automática.
                </p>
              </TabsContent>

              <TabsContent value="url" className="pt-4 space-y-3">
                <Textarea
                  placeholder={'Cole as URLs aqui (uma por linha):\nhttps://drive.google.com/file/d/.../view\nhttps://drive.google.com/open?id=...\nhttps://exemplo.com/foto.jpg'}
                  rows={5}
                  value={urlsTexto}
                  onChange={(e) => setUrlsTexto(e.target.value)}
                  disabled={importandoUrls}
                />
                <div className="flex items-center gap-2">
                  <Button onClick={importarUrls} disabled={importandoUrls || !urlsTexto.trim()}>
                    {importandoUrls ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                    Importar URLs
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    O link do Drive precisa estar como "Qualquer pessoa com o link pode visualizar".
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {pending.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm mt-4">
                <Badge variant="outline">{totalVinculadas} vinculadas</Badge>
                {totalNaoVinculadas > 0 && <Badge variant="destructive">{totalNaoVinculadas} sem vínculo</Badge>}
                {totalEnviadas > 0 && <Badge className="bg-success text-success-foreground">{totalEnviadas} enviadas</Badge>}
              </div>
            )}
            {uploading && <Progress value={progress} className="mt-3" />}
            <div className="flex flex-wrap gap-2 mt-4">
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

        {/* Grid estilo Google Drive */}
        {pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Galeria de fotos na fila</CardTitle>
              <CardDescription>Visual estilo Drive — clique para vincular ao profissional. CPF e matrícula em destaque para localização rápida.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {pending.map((photo) => {
                  const matched = profissionais.find((p) => p.id === photo.matchedProfId);
                  return (
                    <div
                      key={photo.id}
                      className={`group relative rounded-lg overflow-hidden border-2 bg-card transition-all ${
                        photo.uploaded
                          ? 'border-success'
                          : photo.error
                          ? 'border-destructive'
                          : matched
                          ? 'border-primary/50 hover:border-primary'
                          : 'border-warning/50 hover:border-warning'
                      }`}
                    >
                      {/* Foto grande */}
                      <div className="aspect-square w-full bg-muted relative">
                        <img
                          src={photo.previewUrl}
                          alt={photo.source}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {photo.uploaded && (
                          <div className="absolute inset-0 bg-success/80 flex items-center justify-center">
                            <Check className="h-12 w-12 text-success-foreground" />
                          </div>
                        )}
                        {photo.error && (
                          <div className="absolute top-1 left-1 right-1">
                            <Badge variant="destructive" className="text-[10px] w-full justify-center truncate">
                              {photo.error}
                            </Badge>
                          </div>
                        )}
                        {!photo.uploaded && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 hover:bg-background"
                            onClick={() => removePhoto(photo.id)}
                            disabled={uploading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {/* Informações + select */}
                      <div className="p-2 space-y-1.5">
                        {matched ? (
                          <>
                            <div className="text-xs font-bold truncate" title={matched.nome}>{matched.nome}</div>
                            <div className="text-[10px] text-muted-foreground space-y-0.5">
                              <div className="font-mono">Mat. {matched.matricula}</div>
                              {matched.cpf && <div className="font-mono">{formatCPF(matched.cpf)}</div>}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-warning font-medium truncate" title={photo.source}>
                            ⚠️ Vincule abaixo
                          </div>
                        )}
                        {!photo.uploaded && (
                          <select
                            className="w-full h-7 rounded-md border bg-background px-1 text-[10px]"
                            value={photo.matchedProfId || ''}
                            onChange={(e) => setMatch(photo.id, e.target.value || undefined)}
                          >
                            <option value="">— vincular —</option>
                            {profissionais.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome} ({p.matricula})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
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
                        <div className="text-xs text-muted-foreground">Mat. {p.matricula} {p.cpf && `• ${formatCPF(p.cpf)}`}</div>
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
