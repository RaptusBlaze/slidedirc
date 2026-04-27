import { useDropzone } from 'react-dropzone';

export function DropZone({ label, folder, onDrop }) {
  const { getRootProps, getInputProps, isDragOver } = useDropzone({
    onDrop: (acceptedFiles) => {
      const imageFiles = acceptedFiles.filter(f =>
        f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|tiff?|svg)$/i.test(f.name)
      );
      if (imageFiles.length === 0) return;
      const files = imageFiles.map(f => ({
        name: f.name,
        url: URL.createObjectURL(f),
      }));
      const folderName = imageFiles[0].webkitRelativePath
        ? imageFiles[0].webkitRelativePath.split('/')[0]
        : label;
      onDrop(folderName, files);
    },
    noClick: false,
    noDrag: false,
    useFsAccessApi: false,
  });

  const dragOverClass = isDragOver
    ? 'border-green-400 bg-green-500/20'
    : folder
    ? 'border-blue-400 bg-blue-500/10'
    : 'border-gray-400 bg-gray-800/30';

  return (
    <div
      {...getRootProps()}
      className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${dragOverClass}`}
    >
      <input {...getInputProps()} webkitdirectory="true" directory="true" multiple />
      {folder ? (
        <div className="text-center px-4">
          <div className="text-4xl mb-3">📁</div>
          <div className="text-white font-semibold text-lg truncate max-w-xs">{folder.name}</div>
          <div className="text-gray-300 text-sm mt-1">{folder.files.length} image{folder.files.length !== 1 ? 's' : ''}</div>
          <div className="text-gray-500 text-xs mt-2">Drop another folder to replace</div>
        </div>
      ) : (
        <div className="text-center px-4">
          <div className="text-5xl mb-4">📂</div>
          <div className="text-gray-200 font-semibold text-xl">{label}</div>
          <div className="text-gray-400 text-sm mt-2">Drop a folder here</div>
        </div>
      )}
    </div>
  );
}
