export const EmptyProduct = {
  name: '',
  price: 0,
  image: '',
  url: '',
  code: '',
  parent_code: '',
  quantity: 1,
  quantity_max: 0,
  quantity_min: 0,
  description: '',
  category: '',
  expires: '',
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  shipto: '',
  productId: 0,
  alt: '',
  signature: '',
  open: [],
  products: [],
  childProducts: [],
};

export type QuickOrderProduct = Partial<typeof EmptyProduct> & {
  [key: string]: string | number | undefined;
};
