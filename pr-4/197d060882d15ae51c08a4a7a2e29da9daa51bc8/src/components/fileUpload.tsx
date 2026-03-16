'use client';

import type React from 'react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';
import { useUploadMedia } from '@/lib/api/upload';
import type { Task } from '@/types/type';
import { AssetGrid } from './asset-view';

interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed';
}

export default function FileUpload({
  task,
  setTask,
}: {
  task: Task | undefined;
  setTask?: React.Dispatch<React.SetStateAction<Task | undefined>>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const filePickerRef = useRef<HTMLInputElement>(null);

  /* ---------------- helpers ---------------- */
  const { mutateAsync: uploadMedia } = useUploadMedia(Number(task?.id));

  const openFilePicker = () => {
    filePickerRef.current?.click();
  };

  const createUploadItems = (files: File[]): UploadItem[] =>
    files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      progress: 0,
      status: 'uploading',
      controller: new AbortController(),
    }));

  const startUpload = async (files: File[]) => {
    const uploadItems = createUploadItems(files);

    setUploads((prev) => [...uploadItems, ...prev]);

    const controller = new AbortController();

    try {
      const { data = [] } = await uploadMedia({
        files,
        signal: controller.signal,
        onProgress: (percent) => {
          setUploads((prev) =>
            prev.map((item) =>
              uploadItems.some((u) => u.id === item.id)
                ? { ...item, progress: percent }
                : item
            )
          );
        },
      });
      setTask?.((prev: Task | undefined) => {
        if (prev) {
          return { ...prev, assets: [...(prev?.assets ?? []), ...data] };
        }
      });

      setUploads((prev) =>
        prev.map((item) =>
          uploadItems.some((u) => u.id === item.id)
            ? { ...item, progress: 100, status: 'completed' }
            : item
        )
      );
      setFiles([]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'CanceledError') return;

      setUploads((prev) =>
        prev.filter((item) => !uploadItems.some((u) => u.id === item.id))
      );
    }
  };

  /* ---------------- events ---------------- */

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const filesData = event.target.files ? Array.from(event.target.files) : [];
    if (filesData.length) {
      setFiles(filesData);
    }
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const onDropFiles = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length) startUpload(files);
  };

  const removeUploadById = (id: string) => {
    setUploads((prev) => prev.filter((file) => file.id !== id));
  };

  const activeUploads = uploads.filter((file) => file.status === 'uploading');
  const completedUploads = uploads.filter(
    (file) => file.status === 'completed'
  );
  console.log('completeee', completedUploads, task);

  /* ---------------- UI ---------------- */

  return (
    <>
      <div className='mx-auto flex w-full max-w-sm flex-col gap-y-6 mt-5'>
        <Card
          className='group flex max-h-[200px] w-full flex-col items-center justify-center gap-4 py-8 border-dashed text-sm cursor-pointer hover:bg-muted/50 transition-colors'
          onDragOver={onDragOver}
          onDrop={onDropFiles}
          onClick={openFilePicker}
        >
          <div className='grid space-y-3'>
            <div className='flex items-center gap-x-2 text-muted-foreground'>
              <Upload className='size-5' />
              <div>
                Drop files here or{' '}
                <Button
                  variant='link'
                  className='text-primary p-0 h-auto font-normal'
                  // onClick={openFilePicker}
                >
                  browse files
                </Button>{' '}
                to add
              </div>
            </div>
          </div>

          <input
            ref={filePickerRef}
            type='file'
            className='hidden'
            accept='image/png,image/jpeg,image/gif,video/mp4'
            multiple
            onChange={onFileInputChange}
          />

          <span className='text-base/6 text-muted-foreground mt-2 block sm:text-xs'>
            Supported: JPG, PNG, GIF (max 10 MB)
          </span>
        </Card>

        <div className='flex flex-col gap-y-4'>
          {activeUploads.length > 0 && (
            <div>
              <h2 className='text-foreground text-lg flex items-center font-mono uppercase sm:text-xs mb-4'>
                <Loader2 className='size-4 mr-1 animate-spin' />
                Uploading
              </h2>

              <div className='-mt-2 divide-y'>
                {activeUploads.map((file) => (
                  <div key={file.id} className='group flex items-center py-4'>
                    <div className='mr-3 grid size-10 place-content-center rounded border bg-muted'>
                      <FileText className='size-4 group-hover:hidden' />
                      <Button
                        variant='ghost'
                        size='icon'
                        className='hidden group-hover:inline size-4 p-0'
                        onClick={() => removeUploadById(file.id)}
                      >
                        <X className='size-4' />
                      </Button>
                    </div>

                    <div className='flex flex-col w-full'>
                      <div className='flex justify-between'>
                        <span>{file.name}</span>
                        <span>{file.progress}%</span>
                      </div>
                      <Progress value={file.progress} className='mt-1 h-2' />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeUploads.length > 0 && completedUploads.length > 0 && (
            <Separator />
          )}

          {completedUploads.length > 0 && (
            <div>
              <h2 className='text-foreground text-lg flex items-center font-mono uppercase sm:text-xs mb-4'>
                <CheckCircle className='size-4 mr-1' />
                Finished
              </h2>

              <div className='-mt-2 divide-y'>
                {completedUploads.map((file) => (
                  <div key={file.id} className='flex items-center py-4'>
                    <FileText className='size-4 mr-3' />
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeUploads.length === 0 && files.length > 0 && (
            <div>
              <h2 className='text-foreground text-lg font-mono uppercase sm:text-xs mb-3'>
                Selected Files
              </h2>

              <div className='-mt-2 divide-y'>
                {files.map((file, index) => (
                  <>
                    <div
                      key={`${file.name}-${index}`}
                      className='group flex items-center py-3'
                    >
                      <div className='mr-3 grid size-10 place-content-center rounded border bg-muted'>
                        <FileText className='size-4 group-hover:hidden' />
                        <Button
                          variant='ghost'
                          size='icon'
                          className='hidden group-hover:inline size-4 p-0'
                          onClick={() =>
                            setFiles((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <X className='size-4' />
                        </Button>
                      </div>

                      <span className='truncate'>{file.name}</span>
                    </div>
                  </>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className='mt-4 flex gap-2'>
          <Button onClick={() => startUpload(files)}>Upload</Button>
        </div>
      </div>
      {task?.assets && task?.assets?.length > 0 && (
        <AssetGrid assets={task.assets} />
      )}
    </>
  );
}
