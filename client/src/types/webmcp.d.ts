type RegisteredWebMcpTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (
    input: Record<string, unknown>,
    context?: { signal?: AbortSignal },
  ) => Promise<unknown>;
};

interface ModelContextApi {
  registerTool: (
    tool: RegisteredWebMcpTool,
    options?: { signal?: AbortSignal },
  ) => Promise<void>;
  getTools?: () => Promise<Array<{ name: string }>>;
}

interface Document {
  modelContext?: ModelContextApi;
}
