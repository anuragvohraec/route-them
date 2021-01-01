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
## Controlling page behavior with **behaves** attribute
1. on a page **behaves** attribute can be provided, which can have three value: **hide** | **lazyhide** | **reload**
2. **hide** all pages will be loaded, but only kept hidden. **lazyhide** will not render page iuntil its once called., after that it keep loaded. And **reload** will remove and reload the page, wheenever that page is accessed.
3. default value is **lazyhide**.


## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.

## Local Demo with `web-dev-server`
```bash
npm start
```
To run a local development server that serves the basic demo located in `demo/index.html`

## Version info
### "version": "4.0.1"
1. Bug fix: Uncaught DOMException: Failed to execute 'define' on 'CustomElementRegistry': the name "route-them-controller" has already been used with this registry.

### "version": "4.0.0"
1. Need for version 4: Nested route-them where creating a lot of trouble. As both of them use to register window.onpopstate listeners.
In an app only one router should be allowed to deal with history, and not every one (which created issues).
Therefore from this version on every default router will not control history. Only **the one** passed `save_history:true` flag will be saving the history. In case any app tries to register multiple router bloc with this configuration, route-them will throw error.
The implications of this is that gtoPage will no more have configuration to save to history functionality, as it will controlled something at construction time of that router.
2. Now we have new widgets to control app level page routing.
* app-pages-controller
* app-pages-container
* app-page


### "version": "3.0.2"
1. Upgraded bloc-them. facing bugs when route -the are nested with each others.

### "version": "3.0.1"
1. On pop state if null is given then it will return the init state. Bug was because of this.

### "version": "3.0.0"
1. Now all route-them-controller, route-them , and a-page is a 100% width and height;

### "version": "2.0.6"
1. updated as per bloc-them, making overall more generic approach

### "version": "2.0.5"
1. made further small changes to make router more generic and extensible 

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
