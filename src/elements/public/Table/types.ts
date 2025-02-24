import { TemplateResult, html } from 'lit-html';

import { Primitive } from 'lit-html/lib/parts';

export type Collection<TCurie extends string = any, TResource = any> = {
  readonly _links: Record<'next' | 'self', { href: string }>;
  readonly _embedded: Record<TCurie, readonly TResource[]>;
  readonly total_items: number;
  readonly returned_items: number;
  readonly offset: number;
  readonly limit: number;
};

export type TemplateFunction = typeof html;

export type HeaderContext<TData extends Collection> = {
  html: TemplateFunction;
  data: TData | null;
  lang: string;
};

export type CellContext<TData extends Collection> = {
  html: TemplateFunction;
  data: TData['_embedded'][keyof TData['_embedded']][number];
  lang: string;
};

export type Column<TData extends Collection> = {
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
  header?: (context: HeaderContext<TData>) => TemplateResult | Primitive;
  cell?: (context: CellContext<TData>) => TemplateResult | Primitive;
};
