import { clientBundle } from '../../build/client-bundle.ts'

export default clientBundle(
  '@dsh-control-center/control-center',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
