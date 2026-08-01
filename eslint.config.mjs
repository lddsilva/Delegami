import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    // delegami-app is a separate project with its own config and lint history.
    ignores: ['.next/**', 'node_modules/**', 'delegami-app/**'],
  },
]

export default eslintConfig
