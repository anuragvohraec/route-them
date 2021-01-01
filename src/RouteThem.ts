import { html, TemplateResult} from 'lit-html';
import {Bloc, BlocsProvider, BlocBuilder, BlocType} from 'bloc-them';
import { Compass, PathDirection} from './compass';


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
  private _init_path: string;

  constructor(private routerConfig?:RouterConfig, private initState: RouteState = RouteThemBloc.INIT_STATE){
    super(initState,routerConfig?.bloc_name);
    this._compass.define("/");
    let t = document.location.pathname;
    this._init_path = t.substring(0,t.length-1);

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
      if(this.routerConfig?.save_history){
        let t = url_path.split('/').join('-').toUpperCase().substring(1);
        history.pushState(newRouteState,t,window.location.origin+this._init_path+url_path);
      }
    }else{
      console.log(`No route exists for path: ${url_path}`);
      
    }
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
  }

  builder(state: number): TemplateResult {
    return html`<div style="width:100%;height:100%;"><slot></slot></div>`;
  }
}


export class APage extends BlocBuilder<RouteThemBloc, RouteState>{
  static _allowedBehavior: Set<string>=new Set<string>(["hide","lazyhide","reload"]);
  
  private _loaded_once: boolean=false;

  constructor(blocType: BlocType<RouteThemBloc, RouteState>=RouteThemBloc){
    super(blocType)
  }

  
  public get route() : string {
    let r = this.getAttribute("route");
    if(!r){
      throw `No route defined for a page`;
    }else{
      return r;
    } 
  }
  

  /**
   * Default behavior is lazyhide
   */
  private getBehavior():"hide"|"lazyhide"|"reload"{
    let r = this.getAttribute("behaves");
    if(r){
      r = r.toLowerCase();
      if(APage._allowedBehavior.has(r)){
        //@ts-ignore
        return r;
      }
    }
    return "lazyhide";
  }

  private toBeHidden(state: RouteState):boolean{
    if(state.pathDirection.matched_pattern === this.route){
      return false;
    }else{
      return true;
    }
  }

  builder(state: RouteState): TemplateResult {
    let doHide:boolean = this.toBeHidden(state);

    switch(this.getBehavior()){
      case "hide":
        return this._getBaseTemplate(doHide);
      case "reload":
        if(doHide){
          return html``;
        }else{
          return this._getBaseTemplate(false);
        }
      case "lazyhide":{
        //if its for the first time
        if(!this._loaded_once){
          if(doHide){
            return html``;
          }else{
            //that means we need to show;
            this._loaded_once = true;
            return this._getBaseTemplate(false);
          }
        }else{
          //its already loaded 
          return this._getBaseTemplate(doHide);
        }
      }
    }
    
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