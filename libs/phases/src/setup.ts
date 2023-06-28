import { DBs } from '@gpt-team/db'

export function setupSysPrompt(dbs: DBs): string {
  return dbs.identity.getItem('setup') + '\nUseful to know:\n' + dbs.identity.getItem('philosophy')
}
