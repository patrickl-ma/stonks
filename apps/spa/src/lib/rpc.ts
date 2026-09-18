import { JSONRPCClient } from 'json-rpc-2.0'

const apiURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export type RpcMethods = {
  health: {
    params: Record<string, never>
    result: { status: string }
  }
  'auth.getSession': {
    params: Record<string, never>
    result: unknown
  }
}

type RpcMethod = keyof RpcMethods

const client = new JSONRPCClient(async (request) => {
  const response = await fetch(`${apiURL}/api/rpc`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(request),
  })

  if (response.status === 204) {
    return
  }

  if (!response.ok) {
    throw new Error(`JSON-RPC request failed with status ${response.status}`)
  }

  client.receive(await response.json())
})

export function rpcRequest<Method extends RpcMethod>(
  method: Method,
  params: RpcMethods[Method]['params'],
): Promise<RpcMethods[Method]['result']> {
  return client.request(method, params, undefined) as Promise<RpcMethods[Method]['result']>
}

export const rpcClient = client