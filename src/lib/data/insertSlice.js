/**
 *
 * @param {Object} imageData - The vtkImageData
 * @param {*} sliceIndex - The index of the slice you are inserting.
 * @param {*} image The cornerstone image to pull pixel data data from.
 * @param {*} modality The modality of the image.
 * @param {*} modalitySpecificScalingParameters Specific scaling paramaters for this modality. E.g. Patient weight.
 */

import MinMaxRange from './minMaxRange';

export default function insertSlice(
  imageData,
  sliceIndex,
  image,
  modality,
  modalitySpecificScalingParameters
) {
  const scalars = imageData.getPointData().getScalars();
  const scalarData = scalars.getData();

  const scalingFunction = _getScalingFunction(
    modality,
    image,
    modalitySpecificScalingParameters
  );

  const pixels = image.getPixelData();
  const { rows, columns } = image;
  const sliceLength = rows * columns;

  let pixelIndex = 0;

  const componentsN = scalars.getNumberOfComponents();
  const pixelValues = new Int16Array(componentsN);
  const range = new MinMaxRange(componentsN);

  for (let row = 0, flipRow = rows - 1; row < rows; row++, flipRow--) {
    for (let col = 0; col < columns; col++) {
      const destIdx = row * columns + col + sliceIndex * sliceLength;

      const originalPixels = pixels.slice(pixelIndex, pixelIndex + componentsN);
      originalPixels.forEach(
        (p, idx) => (pixelValues[idx] = scalingFunction(p))
      );

      pixelValues.forEach((v, idx) => {
        range.updateRangeI(idx, v);
      });
      scalars.setTuple(destIdx, pixelValues);
      pixelIndex += componentsN === 3 ? componentsN + 1 : componentsN;
    }
  }

  return range;
}

function _getScalingFunction(
  modality,
  image,
  modalitySpecificScalingParameters
) {
  const { slope, intercept } = image;

  if (modality === 'PT') {
    const { patientWeight, correctedDose } = modalitySpecificScalingParameters;
    return pixel => {
      const modalityPixelValue = pixel * slope + intercept;

      return (1000 * modalityPixelValue * patientWeight) / correctedDose;
    };
  } else {
    return pixel => {
      return pixel * slope + intercept;
    };
  }
}
