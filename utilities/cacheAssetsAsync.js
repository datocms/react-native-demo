import { Image } from 'react-native';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';

export default function cacheAssetsAsync({ images = [], fonts = [] }) {
  return Promise.all([...cacheImages(images), ...cacheFonts(fonts)]);
}

function cacheImages(images) {
  return images.map(image => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}

function cacheFonts(fonts) {
  return fonts.map(font => Font.loadAsync(font));
}


