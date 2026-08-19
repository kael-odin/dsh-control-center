import { clientBundle } from '../../build/client-bundle.ts'

export default clientBundle(
  '@dsh-control-center/bundle',
  ['lib/types/index.js', 'lib/types/invariant.js', 'lib/types/translation-remote-client.js', 'lib/types/painting-remote-client.js', 'lib/types/knowledge-remote-client.js'],
)
