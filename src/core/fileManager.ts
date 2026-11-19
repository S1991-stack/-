import { AudioTrack } from '../types/audio';
import { localDb } from './database';
import { errorHandler } from './errorHandler';
import { parseAudioFile, SUPPORTED_EXTENSIONS } from './metadataParser';

export interface ImportProgress {
  total: number;
  processed: number;
  added: number;
  skippedDuplicates: number;
  corrupted: number;
  currentFile: string;
}

function isSupportedAudioFile(file: File): boolean {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if ((SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) return true;
  return file.type.startsWith('audio/');
}

function makeTrackFingerprint(file: File, folder: string): string {
  return `${folder}::${file.name}::${file.size}`;
}

export async function importAudioFiles(
  files: File[],
  folderLabel = 'المجلد المحلي',
  onProgress?: (progress: ImportProgress) => void
): Promise<{ addedTracks: AudioTrack[]; progress: ImportProgress }> {
  const audioFiles = files.filter(isSupportedAudioFile);
  const existingTracks = await localDb.getAllTracks();
  const existingFingerprints = new Set(
    existingTracks.map((t) => `${t.folder}::${t.fileName}::${t.fileSize}`)
  );

  const progress: ImportProgress = {
    total: audioFiles.length,
    processed: 0,
    added: 0,
    skippedDuplicates: 0,
    corrupted: 0,
    currentFile: '',
  };

  const addedTracks: AudioTrack[] = [];

  for (const file of audioFiles) {
    // Yield to browser UI thread to prevent UI freezing on large folders
    await new Promise((r) => setTimeout(r, 0));

    const relativeFolder =
      (file as File & { webkitRelativePath?: string }).webkitRelativePath
        ?.split('/')
        .slice(0, -1)
        .join('/') || folderLabel;

    progress.currentFile = file.name;
    const fp = makeTrackFingerprint(file, relativeFolder);

    if (existingFingerprints.has(fp)) {
      progress.skippedDuplicates += 1;
      progress.processed += 1;
      onProgress?.({ ...progress });
      continue;
    }

    try {
      const parsed = await parseAudioFile(file, relativeFolder);
      if (parsed.isCorrupted) {
        progress.corrupted += 1;
        errorHandler.report(`تعذر تشغيل الملف التالف: ${file.name}`, parsed.corruptedReason);
      }

      const track: AudioTrack = {
        ...parsed,
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        addedAt: Date.now(),
        playCount: 0,
      };

      await localDb.saveTrack(track, file);
      existingFingerprints.add(fp);
      addedTracks.push(track);
      progress.added += 1;
    } catch (err) {
      progress.corrupted += 1;
      errorHandler.report(`خطأ أثناء قراءة الملف: ${file.name}`, err);
    }

    progress.processed += 1;
    onProgress?.({ ...progress });
  }

  return { addedTracks, progress };
}

interface DirectoryHandleLike {
  name: string;
  values: () => AsyncIterable<FileSystemHandleLike>;
}

interface FileSystemHandleLike {
  kind: 'file' | 'directory';
  name: string;
  getFile?: () => Promise<File>;
  values?: () => AsyncIterable<FileSystemHandleLike>;
}

async function collectFilesFromDirectoryHandle(
  dirHandle: DirectoryHandleLike,
  prefix = ''
): Promise<Array<{ file: File; folder: string }>> {
  const collected: Array<{ file: File; folder: string }> = [];
  const currentFolder = prefix ? `${prefix}/${dirHandle.name}` : dirHandle.name;

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && entry.getFile) {
      try {
        const file = await entry.getFile();
        if (isSupportedAudioFile(file)) {
          Object.defineProperty(file, 'webkitRelativePath', {
            value: `${currentFolder}/${file.name}`,
            configurable: true,
          });
          collected.push({ file, folder: currentFolder });
        }
      } catch {
        // Ignore unreadable file entry
      }
    } else if (entry.kind === 'directory' && entry.values) {
      const nested = await collectFilesFromDirectoryHandle(entry as unknown as DirectoryHandleLike, currentFolder);
      collected.push(...nested);
    }
  }
  return collected;
}

export async function pickFolderViaDirectoryPicker(): Promise<{
  supported: boolean;
  folderName?: string;
  files?: File[];
}> {
  const picker = (window as unknown as { showDirectoryPicker?: () => Promise<DirectoryHandleLike> })
    .showDirectoryPicker;

  if (!picker) {
    return { supported: false };
  }

  const dirHandle = await picker();
  const entries = await collectFilesFromDirectoryHandle(dirHandle);
  return {
    supported: true,
    folderName: dirHandle.name,
    files: entries.map((e) => e.file),
  };
}
