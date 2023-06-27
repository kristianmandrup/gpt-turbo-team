import { ChatCompletionRequestMessage } from 'openai'

export type CreateAiResponse = {
  messages: ChatCompletionRequestMessage[]
  prompt?: string
}

export type GetAiResponseResult = Promise<ChatCompletionRequestMessage[]>

export type AiResponse = (opts: any) => GetAiResponseResult

export const $createGetAiResponse = (opts: any) => async ({ messages, prompt }: CreateAiResponse): GetAiResponseResult => {
    const { ai, output } = opts
    if (!ai) {
    throw 'aiResponse: Missing ai instance'
    }
    const response: ChatCompletionRequestMessage[] = await ai.next({ messages, prompt, output })
    return response
}

export const createGetAiResponse =
  (opts: any): AiResponse => {
    if (opts.getAiResponse) return opts.getAiResponse
    return $createGetAiResponse(opts)
}
    
