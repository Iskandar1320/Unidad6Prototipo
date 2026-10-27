import * as THREE from 'three';
import { figurePoints, SCENES } from './figures.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const rand = (a,b) => a + Math.random() * (b-a);

// Cada agente de la escena consulta una celda del campo vectorial y
// combina su dirección con separación/alineación/cohesión y fuerzas locales.
class FlowField {
  constructor() { this.cell = .68; this.resize(23,13); }
  resize(w,h) {
    this.left = -w/2-1; this.bottom = -h/2-1;
    this.cols = Math.ceil((w+2)/this.cell)+1;
    this.rows = Math.ceil((h+2)/this.cell)+1;
    this.vx = new Float32Array(this.cols*this.rows);
    this.vy = new Float32Array(this.cols*this.rows);
  }
  update(time,energy,rx,ry) {
    for (let j=0;j<this.rows;j++) for(let i=0;i<this.cols;i++) {
      const x = this.left+i*this.cell, y = this.bottom+j*this.cell;
      const angle = Math.atan2(y/ry,x/rx) + Math.PI/2;
      const warp = (Math.sin(x*.68+time*.17)*Math.cos(y*.72-time*.25)
        + .48*Math.sin(x*.34-y*.55+time*.39))*(.29+energy*.50);
      const a=angle+warp;
      const k=j*this.cols+i;
      this.vx[k] = Math.cos(a); this.vy[k] = Math.sin(a);
    }
  }
  sample(x,y) {
    const fx=clamp((x-this.left)/this.cell,0,this.cols-1.001);
    const fy=clamp((y-this.bottom)/this.cell,0,this.rows-1.001);
    const ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy;
    const k=iy*this.cols+ix;
    const interp=(arr)=>mix(mix(arr[k],arr[k+1],tx),mix(arr[k+this.cols],arr[k+this.cols+1],tx),ty);
    const vx=interp(this.vx),vy=interp(this.vy);
    const inv=1/(Math.hypot(vx,vy)||1);
    return [vx*inv,vy*inv];
  }
}

const vertexShader = `
  attribute float aOpacity;
  attribute float aSize;
  uniform float uPixelRatio;
  varying float vOpacity;
  void main(){
    vOpacity = aOpacity;
    vec4 mvPosition = modelViewMatrix * vec4(position,1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = max(1.0, aSize * uPixelRatio);
  }
`;
const fragmentShader = `
  uniform vec3 uColor;
  varying float vOpacity;
  void main(){
    vec2 center = gl_PointCoord - vec2(.5);
    float radius = length(center);
    float mask = 1.0 - smoothstep(.30,.50,radius);
    float halo = (1.0 - smoothstep(.07,.50,radius)) * .15;
    float alpha = vOpacity * clamp(mask + halo,0.0,1.0);
    if(alpha < .006) discard;
    gl_FragColor = vec4(uColor,alpha);
  }
`;

class PointLayer {
  constructor(scene, n, globalUniform) {
    this.count = n;
    this.pos = new Float32Array(n*3);
    this.opacity = new Float32Array(n);
    this.size = new Float32Array(n);
    this.geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(this.pos,3);
    const opAttr = new THREE.BufferAttribute(this.opacity,1);
    const szAttr = new THREE.BufferAttribute(this.size,1);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    opAttr.setUsage(THREE.DynamicDrawUsage);
    szAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position',posAttr);
    this.geometry.setAttribute('aOpacity',opAttr);
    this.geometry.setAttribute('aSize',szAttr);
    this.geometry.setDrawRange(0,n);
    this.material = new THREE.ShaderMaterial({
      uniforms: { uColor: globalUniform.color, uPixelRatio: globalUniform.pixelRatio },
      vertexShader,fragmentShader,
      transparent:true,depthWrite:false,depthTest:false,
      blending:THREE.NormalBlending,
    });
    this.points = new THREE.Points(this.geometry,this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.scene = scene;
  }
  update(count=this.count) {
    this.geometry.setDrawRange(0,count);
    this.geometry.attributes.position.needsUpdate=true;
    this.geometry.attributes.aOpacity.needsUpdate=true;
    this.geometry.attributes.aSize.needsUpdate=true;
  }
  dispose() {
    this.scene.remove(this.points);
    this.geometry.dispose();this.material.dispose();
  }
}

class Motif {
  constructor(id,scene,uniforms,field,ellipseX,ellipseY) {
    this.id=id;this.target=figurePoints(id);
    this.agents=this.target.map(t=>({
      x:t.x+rand(-1.12,1.12),y:t.y+rand(-1.02,1.02),
      vx:rand(-.045,.045),vy:rand(-.045,.045),
      tx:t.x,ty:t.y,group:t.group,seed:t.seed,glow:rand(.58,1),size:rand(1.7,2.9),
    }));
    this.layer = new PointLayer(scene,this.agents.length,uniforms);
    this.elapsed=0;
    this.exitTime=null;
    this.releaseImpulse=false;
    this.field=field;this.ellipseX=ellipseX;this.ellipseY=ellipseY;
  }
  exit(){if(this.exitTime === null)this.exitTime=0;}
  get finished(){return this.exitTime!==null && this.exitTime>.5;}
  step(delta, audio,time,scaleX) {
    this.elapsed+=delta;
    if(this.exitTime===null && this.elapsed>=2)this.exit();
    if(this.exitTime!==null)this.exitTime+=delta;
    const entering = smooth(this.elapsed/.43);
    const exiting = this.exitTime===null ? 1 : 1-smooth(this.exitTime/.5);
    const opacity=entering*exiting;
    const norm=clamp(delta*60,.15,1.7);
    const isCut = this.id===2 && this.elapsed>.93;
    const isSignature = this.id===6;
    // El evento no dicta trayectorias: entrega objetivos y modifica el entorno.
    // Cada punto/agente calcula su propio steering y conserva velocidad.
    for(let i=0;i<this.agents.length;i++){
      const a=this.agents[i];
      let tx=a.tx*scaleX,ty=a.ty;
      if(this.id===2){
        if(a.group==='knife')tx+=mix(-.95,.07,smooth(this.elapsed/.83))*scaleX;
        if(a.group==='rope' && isCut){
          const drift=clamp((this.elapsed-.93)*1.5,0,1.65);
          tx+= (a.ty<.75 ? -1.0 : .45)*drift*scaleX;
          ty+= (a.ty<.75 ? -1 : .25)*drift;
        }
      }
      if(this.id===3 && a.group==='foam'){
        ty+=this.elapsed*.30 + Math.sin(this.elapsed*3+a.seed*11)*.12;
        tx+=Math.sin(this.elapsed*1.7+a.seed*12)*.15;
      }
      if(this.id===4 && a.group==='child'){
        tx+=Math.sin(time*.75)*.018;
      }
      if(this.id===5){
        const constriction=smooth(this.elapsed/.82)*.27;
        if(a.group==='left')tx+=constriction*scaleX;
        if(a.group==='right')tx-=constriction*scaleX;
      }
      if(isSignature && a.group==='pen'){
        tx-=smooth(this.elapsed/.95)*.30*scaleX;
        ty-=smooth(this.elapsed/.95)*.13;
      }
      const phase=a.seed*18;
      const vibration=.017 + audio.mid*.045;
      tx+=Math.sin(time*2.2+phase)*vibration*scaleX;
      ty+=Math.cos(time*2.7+phase)*vibration;
      const dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);
      const pursuit=clamp(d*.14,.016,.17);
      let targetVx=dx/(d||1)*pursuit;
      let targetVy=dy/(d||1)*pursuit;
      const [fx,fy]=this.field.sample(a.x,a.y);
      if(this.exitTime!==null){
        targetVx=(fx*.13+(a.x>=0?.07:-.07));
        targetVy=fy*.13 + (a.y>=0?.03:-.03);
      }
      const strength=this.exitTime===null ? .21 : .065;
      a.vx += clamp(targetVx-a.vx,-strength*norm,strength*norm)*.64*norm;
      a.vy += clamp(targetVy-a.vy,-strength*norm,strength*norm)*.64*norm;
      a.vx*=Math.pow(.96,norm);a.vy*=Math.pow(.96,norm);
      a.x+=a.vx*norm;a.y+=a.vy*norm;
      const p=i*3;
      this.layer.pos[p]=a.x;
      this.layer.pos[p+1]=a.y;
      this.layer.pos[p+2]=.15 + a.seed*.35;
      this.layer.opacity[i]=opacity*a.glow*(.8+audio.treble*.33);
      this.layer.size[i]=a.size*(.90+audio.bass*.18);
    }
    this.layer.update();
  }
  dispose(){this.layer.dispose();}
}

export class VisualInstrument {
  constructor(container,onSceneEnd){
    this.container=container;
    this.onSceneEnd=onSceneEnd;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    this.renderer.setSize(window.innerWidth,window.innerHeight);
    container.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene();
    this.camera=new THREE.OrthographicCamera(-10,10,6,-6,.1,100);
    this.camera.position.z=10;
    this.colors={background:'#070809',ink:'#f2f3f0'};
    this.scene.background=new THREE.Color(this.colors.background);
    this.uniforms={
      color:{value:new THREE.Color(this.colors.ink)},
      pixelRatio:{value:Math.min(window.devicePixelRatio||1,2)},
    };
    this.field=new FlowField();
    this.baseCount=window.innerWidth < 700 ? 1050 : 1750;
    this.base=new PointLayer(this.scene,this.baseCount,this.uniforms);
    this.trail=new PointLayer(this.scene,1250,this.uniforms);
    this.trailList=[];
    this.agents=[];
    this.motifs=[];
    this.time=0;this.frame=0;this.fieldCounter=0;this.themeInverted=false;
    this.cursor={x:0,y:0,last:-100,px:0,py:0};
    this.audio={bass:0,mid:0,treble:0,level:0};
    this.lastTrigger=1;
    this.resize();
    for(let i=0;i<this.baseCount;i++){
      const ang=Math.random()*Math.PI*2;
      const fraction=Math.random();
      const radial=fraction<.77?rand(.71,1.04):Math.sqrt(Math.random())*.82;
      const x=Math.cos(ang)*this.rx*radial,y=Math.sin(ang)*this.ry*radial;
      this.agents.push({x,y,vx:rand(-.075,.075),vy:rand(-.075,.075),phase:rand(0,10),size:rand(1.2,2.6),opacity:rand(.40,.93),seed:Math.random()});
    }
    const onPointer=(e)=>{
      const rect=this.renderer.domElement.getBoundingClientRect();
      const x=(e.clientX-rect.left)/rect.width-.5;
      const y=.5-(e.clientY-rect.top)/rect.height;
      this.cursor.px=this.cursor.x;this.cursor.py=this.cursor.y;
      this.cursor.x=x*this.width;this.cursor.y=y*12;
      this.cursor.last=this.time;
    };
    window.addEventListener('pointermove',onPointer);
    window.addEventListener('resize',()=>this.resize());
    window.addEventListener('pointerleave',()=>{this.cursor.last=-100;});
    this.lastFrame=performance.now();
    this.clock=(now)=>{
      const dt=clamp((now-this.lastFrame)/1000,.001,.043);
      this.lastFrame=now;
      this.step(dt);
      this.renderer.render(this.scene,this.camera);
      requestAnimationFrame(this.clock);
    };
    requestAnimationFrame(this.clock);
  }
  resize(){
    const w=this.container.clientWidth||window.innerWidth;
    const h=this.container.clientHeight||window.innerHeight;
    this.width=12*w/h;
    this.rx=Math.min(7.65,this.width*.39);
    this.ry=3.67;
    this.camera.left=-this.width/2;
    this.camera.right=this.width/2;
    this.camera.top=6;this.camera.bottom=-6;
    this.camera.updateProjectionMatrix();
    this.field.resize(this.width,12);
    this.renderer.setSize(w,h);
    this.uniforms.pixelRatio.value=Math.min(window.devicePixelRatio||1,2);
  }
  setAudio(audio){this.audio=audio;}
  invert(){
    this.themeInverted=!this.themeInverted;
    this.colors=this.themeInverted ? {background:'#f4f3ef',ink:'#171717'} : {background:'#070809',ink:'#f2f3f0'};
    this.scene.background.set(this.colors.background);
    this.uniforms.color.value.set(this.colors.ink);
    document.documentElement.classList.toggle('light',this.themeInverted);
    return this.themeInverted;
  }
  trigger(id){
    if(!SCENES[id])return;
    this.lastTrigger=id;
    this.motifs.forEach(m=>m.exit());
    if(id!==1)this.motifs.push(new Motif(id,this.scene,this.uniforms,this.field,this.rx,this.ry));
    if(id===1)this.onSceneEnd?.();
  }
  spawnTrail(x,y,vx,vy,energy=1){
    if(this.trailList.length>=1250)return;
    this.trailList.push({x,y,vx,vy,alpha:.25+Math.random()*.32,life:rand(.36,.87),max:1,size:rand(.65,1.75)*energy});
  }
  step(delta){
    this.time+=delta;this.frame++;
    const dt=clamp(delta*60,.1,1.8);
    const aud=this.audio;
    const bass=aud.bass||0,mid=aud.mid||0,treble=aud.treble||0;
    this.fieldCounter+=delta;
    if(this.fieldCounter>.064){
      this.field.update(this.time,mid,this.rx,this.ry);
      this.fieldCounter=0;
    }
    const mouseActive=this.time-this.cursor.last <.35;
    const mouseRadius=2.15;
    const cellSize=.70;
    const hash=new Map();
    for(let i=0;i<this.agents.length;i++){
      const a=this.agents[i];
      const key=`${Math.floor(a.x/cellSize)},${Math.floor(a.y/cellSize)}`;
      if(!hash.has(key))hash.set(key,[]);
      hash.get(key).push(i);
    }
    const audioPulse=1+bass*.22;
    const n=this.baseCount;
    for(let i=0;i<n;i++){
      const a=this.agents[i];
      const [fx,fy]=this.field.sample(a.x,a.y);
      let desiredX=fx*(.063+mid*.035);
      let desiredY=fy*(.063+mid*.035);
      let sepX=0,sepY=0,avgVX=0,avgVY=0,cohX=0,cohY=0,neighbors=0;
      const gx=Math.floor(a.x/cellSize),gy=Math.floor(a.y/cellSize);
      // Búsqueda LOCAL en una rejilla espacial; no consulta todo el colectivo.
      for(let sy=-1;sy<=1;sy++){
        for(let sx=-1;sx<=1;sx++){
          const bucket=hash.get(`${gx+sx},${gy+sy}`);
          if(!bucket)continue;
          for(let k=0;k<bucket.length;k++){
            const j=bucket[k];if(j===i)continue;
            const b=this.agents[j];
            const dx=a.x-b.x,dy=a.y-b.y;
            const d2=dx*dx+dy*dy;
            if(d2>.65*.65||d2<.0001)continue;
            sepX+=dx/(d2+.05);sepY+=dy/(d2+.05);
            avgVX+=b.vx;avgVY+=b.vy;
            cohX+=b.x;cohY+=b.y;
            neighbors++;
            if(neighbors>=12)break;
          }
          if(neighbors>=12)break;
        }
        if(neighbors>=12)break;
      }
      if(neighbors){
        // separación + alineación + cohesión: Reynolds flocking.
        desiredX+=sepX/neighbors*.070 + (avgVX/neighbors-a.vx)*.18 +(cohX/neighbors-a.x)*.006;
        desiredY+=sepY/neighbors*.070 + (avgVY/neighbors-a.vy)*.18 +(cohY/neighbors-a.y)*.006;
      }
      // Confinamiento elíptico suave. Ninguna trayectoria está prefijada.
      const radius=Math.sqrt((a.x/this.rx)**2+(a.y/this.ry)**2);
      const dirX=a.x/(this.rx||1),dirY=a.y/(this.ry||1);
      if(radius>1.015){
        desiredX-=dirX*(radius-1.015)*.22;
        desiredY-=dirY*(radius-1.015)*.22;
      }else if(radius<.66){
        desiredX+=dirX*(.66-radius)*.024;
        desiredY+=dirY*(.66-radius)*.024;
      }
      if(mouseActive){
        const mx=a.x-this.cursor.x,my=a.y-this.cursor.y;
        const dist=Math.hypot(mx,my);
        if(dist<mouseRadius && dist>.001){
          const atten=((mouseRadius-dist)/mouseRadius)**2;
          desiredX+= (mx/dist*.22 - my/dist*.075)*atten;
          desiredY+= (my/dist*.22 + mx/dist*.075)*atten;
          if(Math.random()<.028)this.spawnTrail(a.x,a.y,a.vx*.30,a.vy*.30,1.0);
        }
      }
      const mag=Math.hypot(desiredX,desiredY)||1;
      const maxSpeed=(.088+mid*.038)*audioPulse;
      if(mag>maxSpeed){desiredX=desiredX/mag*maxSpeed;desiredY=desiredY/mag*maxSpeed;}
      const maxSteer=.012+mid*.012;
      a.vx+=clamp(desiredX-a.vx,-maxSteer,maxSteer)*dt;
      a.vy+=clamp(desiredY-a.vy,-maxSteer,maxSteer)*dt;
      a.vx*=Math.pow(.992,dt);a.vy*=Math.pow(.992,dt);
      a.x+=a.vx*dt;a.y+=a.vy*dt;
      // Si alguna partícula ha escapado, se recupera suavemente en vez de perderla.
      if(Math.abs(a.x)>this.width*.75||Math.abs(a.y)>6.8){a.x=rand(-.6,.6)*this.rx;a.y=rand(-.6,.6)*this.ry;}
      const p=i*3;
      this.base.pos[p]=a.x;this.base.pos[p+1]=a.y;
      this.base.pos[p+2]=a.seed*.12;
      const shape=Math.sin(this.time*.85+a.phase)*.10;
      this.base.opacity[i]=clamp((a.opacity+shape)*(1+treble*.23),.15,1);
      this.base.size[i]=a.size*(1+bass*.32);
      if(this.frame%9===0 && Math.random()<.065 && (Math.abs(a.x)<this.rx*1.1))this.spawnTrail(a.x,a.y,a.vx*.20,a.vy*.20,.65);
    }
    this.base.update();
    // Estelas de agentes autónomos, con vida corta; no son líneas pregrabadas.
    let trails=0;
    for(let j=this.trailList.length-1;j>=0;j--){
      const t=this.trailList[j];
      t.life-=delta;
      if(t.life<=0){this.trailList.splice(j,1);continue;}
      t.x+=t.vx*dt;t.y+=t.vy*dt;
      const p=trails*3;
      this.trail.pos[p]=t.x;this.trail.pos[p+1]=t.y;this.trail.pos[p+2]=-.1;
      this.trail.opacity[trails]=t.alpha*smooth(t.life/.7);
      this.trail.size[trails]=t.size;
      trails++;
    }
    this.trail.update(trails);
    const scaleX=clamp(this.width/19, .62,1);
    for(let i=this.motifs.length-1;i>=0;i--){
      const motif=this.motifs[i];
      motif.step(delta,aud,this.time,scaleX);
      if(motif.finished){
        motif.dispose();this.motifs.splice(i,1);
        if(!this.motifs.length)this.onSceneEnd?.();
      }
    }
  }
}
