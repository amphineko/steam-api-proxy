import * as path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
            },
        ],
    },
    output: {
        filename: 'worker.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
}

export default config
