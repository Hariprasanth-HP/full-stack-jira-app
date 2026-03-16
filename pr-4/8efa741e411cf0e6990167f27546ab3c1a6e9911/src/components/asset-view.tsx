import { AssetType, type Asset } from '@/types/type';
import { useState } from 'react';

interface Props {
  assets: Asset[];
}

export const AssetGrid = ({ assets }: Props) => {
  const [selected, setSelected] = useState<Asset | null>(null);

  return (
    <>
      {/* GRID */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 m-4 0'>
        {assets.map((asset) => (
          <div
            key={asset.publicId}
            onClick={() => setSelected(asset)}
            className='cursor-pointer rounded-lg overflow-hidden border hover:shadow-md transition'
          >
            {asset.type === AssetType.IMAGE && (
              <img
                src={asset.url}
                alt=''
                className='w-full h-32 object-cover'
              />
            )}

            {asset.type === AssetType.VIDEO && (
              <div className='relative'>
                <video
                  src={asset.url}
                  className='w-full h-32 object-cover'
                  muted
                />
                <span className='absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm'>
                  ▶
                </span>
              </div>
            )}

            {asset.type === AssetType.FILE && (
              <div className='h-32 flex items-center justify-center bg-gray-100 text-sm font-medium'>
                📄 File
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selected && (
        <AssetModal asset={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
};

interface ModalProps {
  asset: Asset;
  onClose: () => void;
}

const AssetModal = ({ asset, onClose }: ModalProps) => {
  return (
    <div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center'>
      <div className='relative bg-white rounded-lg max-w-5xl w-full p-4'>
        <button
          onClick={onClose}
          className='absolute top-2 right-2 text-black text-xl'
        >
          ✕
        </button>

        {asset.type === AssetType.IMAGE && (
          <img
            src={asset.url}
            alt=''
            className='w-full max-h-[80vh] object-contain'
          />
        )}

        {asset.type === AssetType.VIDEO && (
          <video
            src={asset.url}
            controls
            autoPlay
            className='w-full max-h-[80vh]'
          />
        )}

        {asset.type === AssetType.FILE && (
          <a
            href={asset.url}
            target='_blank'
            className='text-blue-600 underline'
          >
            Open file
          </a>
        )}
      </div>
    </div>
  );
};
interface ModalProps {
  asset: Asset;
  onClose: () => void;
}
