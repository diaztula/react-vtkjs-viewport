import { vec3 } from 'gl-matrix';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

import buildMetadata from './data/buildMetadata.js';
import imageDataCache from './data/imageDataCache.js';
import sortDatasetsByImagePosition from './data/sortDatasetsByImagePosition.js';

export default function getImageData(imageIds, displaySetInstanceUid) {
  const cachedImageDataObject = imageDataCache.get(displaySetInstanceUid);

  if (cachedImageDataObject) {
    return cachedImageDataObject;
  }

  const { metaData0, metaDataMap, imageMetaData0 } = buildMetadata(imageIds);

  const { rowCosines, columnCosines } = metaData0;
  const rowCosineVec = vec3.fromValues(...rowCosines);
  const colCosineVec = vec3.fromValues(...columnCosines);
  const scanAxisNormal = vec3.cross([], rowCosineVec, colCosineVec);

  const { spacing, origin, sortedDatasets } = sortDatasetsByImagePosition(
    scanAxisNormal,
    metaDataMap
  );

  const xSpacing = metaData0.columnPixelSpacing;
  const ySpacing = metaData0.rowPixelSpacing;
  const zSpacing = spacing;
  const xVoxels = metaData0.columns;
  const yVoxels = metaData0.rows;
  const zVoxels = metaDataMap.size;
  const signed = imageMetaData0.pixelRepresentation === 1;
  const { samplesPerPixel, photometricInterpretation } = imageMetaData0;

  if (samplesPerPixel > 1 && photometricInterpretation !== 'RGB') {
    throw new Error(
      `Multi component image ${photometricInterpretation} not supported by this plugin.`
    );
  }

  let pixelArray;
  switch (imageMetaData0.bitsAllocated) {
    case 8:
      if (signed) {
        throw new Error(
          '8 Bit signed images are not yet supported by this plugin.'
        );
      } else {
        pixelArray = new Uint8Array(
          xVoxels * yVoxels * zVoxels * samplesPerPixel
        );
        break;
      }

    case 16:
      pixelArray = new Float32Array(xVoxels * yVoxels * zVoxels);
      break;
  }

  const scalarArray = vtkDataArray.newInstance({
    name: 'Pixels',
    numberOfComponents: samplesPerPixel,
    values: pixelArray,
  });

  const imageData = vtkImageData.newInstance();
  const direction = [...rowCosineVec, ...colCosineVec, ...scanAxisNormal];

  imageData.setDimensions(xVoxels, yVoxels, zVoxels);
  imageData.setSpacing(xSpacing, ySpacing, zSpacing);

  imageData.setDirection(direction);

  imageData.setOrigin(...origin);
  imageData.getPointData().setScalars(scalarArray);

  const imageDataObject = {
    imageIds,
    metaData0,
    imageMetaData0,
    dimensions: [xVoxels, yVoxels, zVoxels],
    spacing: [xSpacing, ySpacing, zSpacing],
    origin,
    direction,
    vtkImageData: imageData,
    metaDataMap,
    sortedDatasets,
    loaded: false,
  };

  imageDataCache.set(displaySetInstanceUid, imageDataObject);

  return imageDataObject;
}
