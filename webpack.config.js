module.exports = [
	{
		mode: process.env.NODE_ENV || 'production', //'dvelopment', 
		devtool: 'inline-source-map',
		entry: {
			'mlp.min': './src/mlp.js'
		},
		output: {
			path: __dirname,
			filename: 'public/dist/[name].js'
		},
		resolve: {
			extensions: [ '.js' ]
		},
		module: {
			rules: [
			  {
			    test: /\.js$/,
				exclude: /(node_modules)/,
				use: [
				  {
					loader: 'babel-loader',
					options: {
					  presets: [
						[
						  "@babel/preset-env",
						  {
							targets: {
							  ie: 11
							},
							corejs: 3,
							useBuiltIns: 'usage'
						  }
						]
					  ]
					}
				  }
				]
			  }
			]
		  }
	}
];
