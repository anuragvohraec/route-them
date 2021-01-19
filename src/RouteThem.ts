import { html, TemplateResult} from 'lit-html';
import {Bloc, BlocsProvider, BlocBuilder, BlocType} from 'bloc-them';
import { Compass, PathDirection} from './compass';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';

class _Utils{
  /**
 * * build_path("https://my.com/proxy/db","/some1/db?a=12") > "https://my.com/proxy/db/some1/db?a=12"
 * * build_path("https://my.com/proxy/db/","/some1/db?a=12") > "https://my.com/proxy/db/some1/db?a=12"
 * @param args 
 */
static build_path(...args:string[]):string{
  return args.map((part, i) => {
    if (i === 0) {
      return part.trim().replace(/[\/]*$/g, '')
    } else {
      return part.trim().replace(/(^[\/]*|[\/]*$)/g, '')
    }
  }).filter(x=>x.length).join('/')
}

}


export interface RouteState{
  url_path: string;
  pathDirection: PathDirection;
  data?: any;
}

export interface RouterConfig{
  bloc_name:string;
  save_history:boolean;
}

export interface PopStateFunction{
  (e: PopStateEvent):any;
  bloc_name:string;
}

export class RouteThemBloc extends Bloc<RouteState>{
  public static INIT_STATE:RouteState = {url_path:"/", pathDirection: { path_params: {}, matched_pattern: "/", parent_matches: [] }}
  private _compass: Compass = new Compass();
  private _init_path?: string;

  constructor(private routerConfig?:RouterConfig, private initState: RouteState = RouteThemBloc.INIT_STATE){
    super(initState,routerConfig?.bloc_name);
    this._compass.define("/");

    if(this.savesToHistory){
      this._init_path = document.location.pathname;
    }

    if(routerConfig?.save_history){
      if(!routerConfig.bloc_name){
        throw `For saving history bloc_name is mandatory`;
      }
      if(window.onpopstate){
        const prev_bloc= (window.onpopstate as PopStateFunction).bloc_name;
        throw `An app should have only one router which can control history. Some where in your code <${prev_bloc}> window.onpopstate function is already registered. And you are retrying again this in bloc ${routerConfig.bloc_name}!`;
      }
      let p = (e: PopStateEvent)=>{
        let oldState: RouteState = e.state;
        if(!oldState){
          oldState=this.initState;
        }
        this.emit({...oldState});
      };
      //@ts-ignore
      p.bloc_name = routerConfig.bloc_name;

      window.onpopstate = p;
    }
  }

  define(routePath: string){
    this._compass.define(routePath);
  }

  popOutOfCurrentPage(){
    history.back();
  }
  
  goToPage(url_path: string, data?: any){
    let r = this._compass.find(url_path);
    if(r){
      let newRouteState: RouteState = {
        url_path: url_path,
        pathDirection: r,
        data,
      };
      this.emit(newRouteState);
      if(this.savesToHistory){
        let t = url_path.split('/').join('-').toUpperCase().substring(1);
        history.pushState(newRouteState,t,_Utils.build_path(window.location.origin,this._init_path!,url_path));
      }
    }else{
      console.log(`No route exists for path: ${url_path}`);
    }
  }

  _goToPageDoNotSaveHistory(url_path: string,data?: any){
    let r = this._compass.find(url_path);
    if(r){
      let newRouteState: RouteState = {
        url_path: url_path,
        pathDirection: r,
        data,
      };
      this.emit(newRouteState);
    }else{
      console.log(`No route exists for path: ${url_path}`);
    }
  }


  get savesToHistory():boolean{
    return this.routerConfig?.save_history?true:false;
  }

}

export class RouteThemController extends BlocsProvider{
  constructor(){
    super([
      new RouteThemBloc()
    ])
  }

  builder(): TemplateResult {
    return html`<div style="width:100%;height:100%;"><slot></slot></div>`;
  }
}


class _BogusBloc extends Bloc<number>{
  constructor(){
    super(0);
  }
}

/**
 * At first this may seems redundant, but its required to encapsulate pages.
 * Without this man content will be visible uncontrollably.
 */
export class RouteThem extends BlocBuilder<_BogusBloc,number>{
  constructor(private pageTagName: string = "a-page", private routeBlocType: BlocType<RouteThemBloc, RouteState>=RouteThemBloc){
    super(_BogusBloc, {
      useThisBloc: new _BogusBloc()
    });
  }
  
  connectedCallback(){
    super.connectedCallback();
    let routeBloc = BlocsProvider.of(this.routeBlocType,this);
    
    this.querySelectorAll(this.pageTagName).forEach(e=>{
      let r = e.getAttribute("route");
      if(!r){
        throw `No route defined for a page`;
      }
      routeBloc?.define(r);
    });

    if(routeBloc?.savesToHistory){
      const hash = window.location.hash;
      if(hash){
        routeBloc?._goToPageDoNotSaveHistory("/"+hash);
      }
    }
  }

  builder(state: number): TemplateResult {
    return html`<div style="width:100%;height:100%;"><slot></slot></div>`;
  }
}


export class APage extends BlocBuilder<RouteThemBloc, RouteState>{
  private initInnerHTML:string;
  private behavior:"hide"|"reload"="hide";
  
  constructor(blocType: BlocType<RouteThemBloc, RouteState>=RouteThemBloc){
    super(blocType)
    this.initInnerHTML=this.innerHTML;
    let r = this.getAttribute("behaves");
    if(r){
      r = r.toLowerCase();
      //@ts-ignore
      this.behavior=r;
    }
  }

  public get route() : string {
    let r = this.getAttribute("route");
    if(!r){
      throw `No route defined for a page`;
    }else{
      return r;
    } 
  }

  public toBeHidden(state: RouteState):boolean{
    if(state.pathDirection.matched_pattern === this.route){
      return false;
    }else{
      return true;
    }
  }

  builder(state: RouteState): TemplateResult {
    let doHide:boolean = this.toBeHidden(state);

    switch(this.behavior){
      case "hide":
        return this._getBaseTemplate(doHide);
      case "reload":
        return html`${doHide?html`<div></div>`: this._getHtmlWithInnerContent()}`;
      default:
        return this._getBaseTemplate(doHide);
    }
  }

  protected _getHtmlWithInnerContent():TemplateResult{
    this.innerHTML='';
    const t = html`<div style="width:100%;height:100%;">
    ${unsafeHTML(this.initInnerHTML)}
    </div>`;
    return t;
  }

  protected _getBaseTemplate(doHide: boolean): TemplateResult{
    return html`
    <style>
      .hide{
        display: none;
      }
      .show{
        display: block;
      }
    </style>
    <div class="${doHide?'hide':'show'}" style="width:100%;height:100%;">
    <slot></slot>
    </div>
    `;
  }

}

customElements.get("route-them-controller")||customElements.define("route-them-controller", RouteThemController);
customElements.get("route-them")||customElements.define('route-them', RouteThem);
customElements.get("a-page")||customElements.define("a-page", APage);


export class AppPageBloc extends RouteThemBloc{
  constructor(){
    super({
      bloc_name:"AppPageBloc",
      save_history:true
    })
  }
}

export class AppPageController extends BlocsProvider{
  constructor(){
    super([
      new AppPageBloc()
    ])
  }

  builder(): TemplateResult {
    return html`<div style="width:100%;height:100%;"><slot></slot></div>`;
  }
}
customElements.get("app-pages-controller")||customElements.define("app-pages-controller",AppPageController);

export class AppPage extends APage{
  constructor(){
    super(AppPageBloc)
  }
}
customElements.get("app-page")||customElements.define("app-page",AppPage);

export class AppPageContainer extends RouteThem{
  constructor(){
    super("app-page",AppPageBloc);
  }
}
customElements.get("app-pages-container")||customElements.define("app-pages-container",AppPageContainer);