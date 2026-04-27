import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

export function CompareViewer({ pair }) {
  if (!pair) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500">
        No pair selected
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <ReactCompareSlider
        style={{ width: '100%', height: '100%' }}
        itemOne={
          <div className="relative w-full h-full">
            <ReactCompareSliderImage
              src={pair.original.url}
              alt="Original"
              style={{ objectFit: 'contain', background: '#111' }}
            />
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded pointer-events-none">
              Original
            </div>
          </div>
        }
        itemTwo={
          <div className="relative w-full h-full">
            <ReactCompareSliderImage
              src={pair.edited.url}
              alt="Edited"
              style={{ objectFit: 'contain', background: '#111' }}
            />
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded pointer-events-none">
              Edited
            </div>
          </div>
        }
      />
    </div>
  );
}
