export type WebResponse<T> = {
	status: 200;
	data: T;
} | {
	status: 400 | 401 | 403 | 404 | 500 | 503;
	error: unknown;
}

export type CancelOutWebResponses<T extends WebResponse<unknown>> = T extends { status: 200, data: infer U } ? U : never;

export type Simplify<T> = {
	[P in keyof T]: T[P];
}

export type DeepRequired<T> = { [P in keyof T]-?: DeepRequired<T[P]>; };
export type DeepPartial<T, N extends boolean> = { [P in keyof T]?: DeepPartial<T[P], N> | (N extends true ? null : undefined); };
export type DeepRequiredRemoveNull<T> = { [P in keyof T]-?: Exclude<DeepRequiredRemoveNull<T[P]>, null>; };
export type DeepNonNullable<T> = { [P in keyof T]-?: DeepNonNullable<NonNullable<T[P]>>; };
export type DeepNonReadonly<T> = { -readonly [P in keyof T]: DeepNonReadonly<T[P]>; };

export type KeysOf<T> = T extends Record<string, unknown> ? {
	[K in keyof T]-?: K extends string ? `${K}` | (T[K] extends null | undefined ? never : `${K}.${KeysOf<NonNullable<T[K]>>}`) : never;
}[keyof T] : never;
