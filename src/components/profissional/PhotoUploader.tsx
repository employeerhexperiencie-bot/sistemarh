import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { convertToEzpoint, validatePhotoFile } from '@/lib/ezpointPhoto';
import { ProfissionalAvatar } from './ProfissionalAvatar';

interface PhotoUploaderProps {
  profissionalId: string;
  profissionalNome: string;
  fotoUrl?: string | null;
  onUploaded?: (urls: { fotoUrl: string; fotoEzpointUrl: string }) => void;
  onRemoved?: () => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  profissionalId,
  profissionalNome,
  fotoUrl,
  onUploaded,
  onRemoved,
}) => {
  const { tenantId } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    const v = validatePhotoFile(file);
    if (!v.ok) {
      toast({ title: 'Foto inválida', description: v.error, variant: 'destructive' });
      return;
    }
    if (!tenantId) {
      toast({ title: 'Erro', description: 'Tenant não identificado', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ts = Date.now();
      const baseFolder = `${tenantId}/${profissionalId}`;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';

      // 1) Upload original
      const originalPath = `${baseFolder}/original-${ts}.${ext}`;
      const { error: e1 } = await supabase.storage
        .from('professional-photos')
        .upload(originalPath, file, { upsert: true, contentType: file.type });
      if (e1) throw e1;

      // 2) Gera versão Ezpoint
      const ezpointBlob = await convertToEzpoint(file);
      const ezpointPath = `${baseFolder}/ezpoint-${ts}.jpg`;
      const { error: e2 } = await supabase.storage
        .from('professional-photos')
        .upload(ezpointPath, ezpointBlob, { upsert: true, contentType: 'image/jpeg' });
      if (e2) throw e2;

      const { data: u1 } = supabase.storage.from('professional-photos').getPublicUrl(originalPath);
      const { data: u2 } = supabase.storage.from('professional-photos').getPublicUrl(ezpointPath);

      // 3) Atualiza registro do profissional
      const { error: e3 } = await supabase
        .from('profissionais')
        .update({
          foto_url: u1.publicUrl,
          foto_ezpoint_url: u2.publicUrl,
          foto_atualizada_em: new Date().toISOString(),
        })
        .eq('id', profissionalId);
      if (e3) throw e3;

      toast({ title: 'Foto atualizada', description: 'Original + versão Ezpoint geradas.' });
      onUploaded?.({ fotoUrl: u1.publicUrl, fotoEzpointUrl: u2.publicUrl });
    } catch (err: any) {
      toast({ title: 'Erro ao enviar foto', description: err?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remover foto do profissional?')) return;
    setUploading(true);
    try {
      const { error } = await supabase
        .from('profissionais')
        .update({ foto_url: null, foto_ezpoint_url: null, foto_atualizada_em: new Date().toISOString() })
        .eq('id', profissionalId);
      if (error) throw error;
      toast({ title: 'Foto removida' });
      onRemoved?.();
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <ProfissionalAvatar nome={profissionalNome} fotoUrl={fotoUrl} size="xl" />
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
            {fotoUrl ? 'Trocar foto' : 'Enviar foto'}
          </Button>
          {fotoUrl && (
            <Button type="button" variant="outline" size="sm" onClick={handleRemove} disabled={uploading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Sistema gera automaticamente versão otimizada (320x240 JPG) para o ponto facial Ezpoint.
        </p>
      </div>
    </div>
  );
};
