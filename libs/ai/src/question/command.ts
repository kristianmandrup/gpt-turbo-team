export const parseCommand = (content: string | undefined) => content ? content.trim().toLowerCase() : ''

export const getControl= (content?: string) => {
    const possibleCommand = parseCommand(content);
    if (!content || possibleCommand === 'no') {
      return Control.ABORT;
    }    
  }

export enum Control {
  ABORT
} 
