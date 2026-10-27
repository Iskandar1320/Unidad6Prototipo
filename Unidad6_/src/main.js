import './style.css';
import { VisualInstrument } from './visual.js';
import { AudioInput } from './audio.js';
import { SCENES } from './figures.js';

const $=(id)=>document.getElementById(id);
const stage=$('stage');
const toast=$('toast');
const audioStatus=$('audioStatus');
let toastTimer=null;
let hintTimer=null;
let activeScene=1;
let hidden=false;

function notify(message){
  toast.textContent=message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer=window.setTimeout(()=>toast.classList.remove('visible'),2300);
}
function updateSceneLabel(id){
  activeScene=id;
  const s=SCENES[id];
  $('sceneNumber').textContent=String(id).padStart(2,'0')+' / 06';
  $('sceneName').textContent=s.name;
  $('sceneCaption').textContent=s.subtitle;
  document.querySelectorAll('.event-key').forEach(b=>b.classList.toggle('active',Number(b.dataset.scene)===id));
  if(id===1)$('sceneProgress').style.width='0%';
}
const visual=new VisualInstrument(stage,()=>{
  // La escena base se conserva incluso cuando cualquier evento finaliza.
  if(!visual.motifs.some(m=>m.exitTime===null))updateSceneLabel(1);
});
const audio=new AudioInput($('music'),(text)=>{
  audioStatus.textContent=text;
  $('audioIndicator').classList.toggle('connected',!text.startsWith('Sin audio')&&!text.startsWith('Esperando'));
});

function activate(id){
  if(!SCENES[id])return;
  visual.trigger(id);
  updateSceneLabel(id);
}
function toggleInterface(){
  hidden=!hidden;
  document.getElementById('app').classList.toggle('ui-hidden',hidden);
  if(hidden){
    $('helpToast').classList.add('visible');
    clearTimeout(hintTimer);
    hintTimer=setTimeout(()=>$('helpToast').classList.remove('visible'),2300);
  }else $('helpToast').classList.remove('visible');
}
function togglePalette(){
  const inverted=visual.invert();
  notify(inverted?'PALETA INVERTIDA · NEGRO SOBRE BLANCO':'PALETA ORIGINAL · BLANCO SOBRE NEGRO');
}
async function fullscreen(){
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }catch(e){notify('PANTALLA COMPLETA NO DISPONIBLE');}
}
function togglePlay(){
  if(audio.mode!=='file'){notify('PRIMERO CARGA UN ARCHIVO DE AUDIO');return;}
  if($('music').paused){$('music').play().catch(()=>notify('NO SE PUDO REPRODUCIR EL AUDIO'));}
  else $('music').pause();
}
window.addEventListener('keydown',(e)=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.repeat)return;
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if(e.key>='1'&&e.key<='6'){activate(Number(e.key));return;}
  switch(e.key.toLowerCase()){
    case 'b':togglePalette();break;
    case 'h':toggleInterface();break;
    case 'f':fullscreen();break;
    case ' ':e.preventDefault();togglePlay();break;
  }
});
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>activate(Number(button.dataset.scene))));
$('invertBtn').addEventListener('click',togglePalette);
$('toggleHudBtn').addEventListener('click',toggleInterface);
$('fullscreenBtn').addEventListener('click',fullscreen);
$('loadAudio').addEventListener('click',()=>$('audioInput').click());
$('audioInput').addEventListener('change',async(e)=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    await audio.loadFile(file);
    $('audioPlayer').hidden=false;
    $('songName').textContent=file.name.replace(/\.[^.]+$/,'');
  }catch(err){notify('AUDIO: '+err.message);}
});
$('captureTab').addEventListener('click',async()=>{
  try{
    await audio.captureTab();
    $('audioPlayer').hidden=true;
    notify('AUDIO DE PESTAÑA CONECTADO');
  }catch(err){notify(err.name==='NotAllowedError'?'CAPTURA CANCELADA':'AUDIO: '+err.message);}
});
$('useMic').addEventListener('click',async()=>{
  try{
    if(audio.mode==='mic'){audio.stop();notify('MICRÓFONO DESACTIVADO');}
    else{await audio.captureMic();$('audioPlayer').hidden=true;notify('MICRÓFONO ACTIVO');}
  }catch(err){notify('MICRÓFONO: '+err.message);}
});
$('playPause').addEventListener('click',togglePlay);
$('music').addEventListener('play',()=>$('playPause').textContent='Ⅱ');
$('music').addEventListener('pause',()=>$('playPause').textContent='▶');
$('music').addEventListener('ended',()=>$('playPause').textContent='▶');
const clock=(sec)=>{if(!Number.isFinite(sec))return '0:00';return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`;};

// Funciona también sin música: los agentes siguen vivos, esperando interacción.
function renderUI(){
  visual.setAudio(audio.sample());
  $('audioClock').textContent=clock($('music').currentTime);
  const current=visual.motifs.find(m=>m.id===activeScene&&m.exitTime===null);
  if(current)$('sceneProgress').style.width=(Math.min(current.elapsed/2,1)*100).toFixed(1)+'%';
  requestAnimationFrame(renderUI);
}
requestAnimationFrame(renderUI);

// Soporte de arrastrar y soltar archivos de audio locales.
window.addEventListener('dragover',(e)=>{if([...e.dataTransfer.items].some(item=>item.kind==='file'))e.preventDefault();});
window.addEventListener('drop',async(e)=>{
  const file=[...e.dataTransfer.files].find(f=>f.type.startsWith('audio/'));
  if(!file)return;
  e.preventDefault();
  try{
    await audio.loadFile(file);
    $('audioPlayer').hidden=false;
    $('songName').textContent=file.name;
    notify('ARCHIVO DE AUDIO CARGADO');
  }catch(err){notify('AUDIO: '+err.message);}
});
