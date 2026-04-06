export interface PluginMeta {
  description?: string;
  name: string;
  version: string;
}

export interface PluginDefinition<
  Options,
  C extends Record<string, unknown> = {},
>
  extends PluginMeta {
  setup: (options: Options) => import("../redop").Redop<C>;
}

export interface PluginFactory<
  Options,
  C extends Record<string, unknown> = {},
> {
  meta: PluginMeta;
  (options: Options): import("../redop").Redop<C>;
}
