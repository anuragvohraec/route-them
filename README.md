# \<route-them>

This webcomponent follows the [open-wc](https://github.com/open-wc/open-wc) recommendation.

## Installation
```bash
npm i route-them
```

## Usage
For detailed example, see demo in the git lib:

```html
<script type="module">
  import 'route-them/route-them.js';
</script>

<route-them-controller>
  <!--Place any html code you want-->
  <route-them>
      <a-page route="/">
        <!--Place any html code you want-->
      </a-page>
      <a-page route="/contacts/:id">
        <!--Place any html code you want-->
        <!--id param will be accessible inside this page via RouteThem bloc-->
      </a-page>
  </route-them>
  <!--Place any html code you want-->
</route-them-controller>
```

* **route-them-controller**: Controller which provided route them bloc. Placing controller above gives other components down the tree to navigate using controller block.
* **a-page**: A page which will be displayed by this router. The observe the state and get rendered based on that state.
* **route-them**: container for pages

## To switch routes
```js
let routeBloc = BlocsProvider.of(RouteThemBloc,this);
routeBloc.goToPage("/contacts");
```


## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.

## Local Demo with `web-dev-server`
```bash
npm start
```
To run a local development server that serves the basic demo located in `demo/index.html`

## Version info
### "version": "2.0.4"
1. made further small changes to make router more generic.

### "version": "2.0.3"
1. Now you can pass A custom name for page tags to constructor. To create custom conctroller.
```ts
export class RouteThem extends BlocBuilder<_BogusBloc,number>{
  constructor(private pageTagName: string = "a-page"){
    super(_BogusBloc, {
      useThisBloc: new _BogusBloc()
    });
  }
```
