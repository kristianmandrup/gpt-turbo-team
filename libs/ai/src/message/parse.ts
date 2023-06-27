import { ChatCompletionRequestMessage } from 'openai'

export const getLastResponseMessage = (messages: ChatCompletionRequestMessage[]): string | undefined => {
  return messages[messages.length - 1]?.content
}

export const createGetLastResponseMessageBy =
  (role: string) =>
  (messages: ChatCompletionRequestMessage[]): string | undefined => {
    const messagesBy = messages.filter((m) => m.role == role)
    return messagesBy[messagesBy.length - 1]?.content
  }
