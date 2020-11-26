import { html, TemplateResult} from 'lit-html';
import {Bloc, BlocsProvider, BlocBuilder} from 'bloc-them';
import { Compass, PathDirection} from './compass';


export interface RouteState{
  url_path: string;
  pathDirection: PathDirection;
  data?: any;
}

export class RouteThemBloc extends Bloc<RouteState>{
  private _compass: Compass = new Compass();

  constructor(initState: RouteState = {url_path:"/", pathDirection: { path_params: {}, matched_pattern: "/", parent_matches: [] }}){
    super(initState);
    this._compass.define("/");

    window.onpopstate = (e: PopStateEvent)=>{
        let oldState: RouteState = e.state;
        this.emit({...oldState});
    }
  }

  define(routePath: string){
    this._compass.define(routePath);
  }

  popOutOfCurrentPage(){
    history.back();
  }
  
  goToPage(url_path: string, options: {data?: any, saveToBrowserHistory: boolean, title:string}={saveToBrowserHistory: true, title: ""}){
    let r = this._compass.find(url_path);
    if(r){
      let newRouteState: RouteState = {
        url_path: url_path,
        data: options.data,
        pathDirection: r
      };
      this.emit(newRouteState);
      if(options.saveToBrowserHistory){
        history.pushState(newRouteState,options.title,window.location.origin+url_path);
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
    return html`<div><slot></slot></div>`;
  }
}


class _BogusBloc extends Bloc<number>{
  constructor(){
    super(0);
  }
}

export class RouteThem extends BlocBuilder<_BogusBloc,number>{
  constructor(){
    super(_BogusBloc, {
      useThisBloc: new _BogusBloc()
    });
  }
  
  connectedCallback(){
    
    let routeBloc = BlocsProvider.of<RouteThemBloc, RouteState>(RouteThemBloc,this);
    
    this.querySelectorAll("a-page").forEach(e=>{
      let r = e.getAttribute("route");
      if(!r){
        throw `No route defined for a page`;
      }
      routeBloc?.define(r);
    });
  }

  builder(state: number): TemplateResult {
    return html`<div><slot></slot></div>`;
  }
}

export class APage extends BlocBuilder<RouteThemBloc, RouteState>{
  private route:string;
  constructor(){
    super(RouteThemBloc)
    let r = this.getAttribute("route");
    if(!r){
      throw `No route defined for a page`;
    }else{
      this.route=r;
    }
  }

  builder(state: RouteState): TemplateResult {
    
    return html`
    <style>
      .hide{
        display: none;
      }
      .show{
        display: block;
      }
    </style>
    <div class="${(()=>{
      if(state.pathDirection.matched_pattern === this.route){
        return 'show';
      }else{
        return 'hide';
      }
    })()}">
    <slot></slot>
    </div>
    `;
  }
}
