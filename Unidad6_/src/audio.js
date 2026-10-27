/** Audio reactivo opcional: NO dispara escenas ni decide por el intérprete. */
export class AudioInput {
  constructor(audioElement, onStatus){
    this.element=audioElement;
    this.onStatus=onStatus;
    this.context=null;
    this.analyser=null;
    this.freq=null;
    this.mediaNode=null;
    this.streamNode=null;
    this.stream=null;
    this.url=null;
    this.mode='idle';
    this.smoothed={bass:0,mid:0,treble:0,level:0};
  }
  async ensureAudio(){
    if(!this.context){
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx)throw new Error('Este navegador no permite analizar audio.');
      this.context=new Ctx();
      this.analyser=this.context.createAnalyser();
      this.analyser.fftSize=1024;
      this.analyser.smoothingTimeConstant=.74;
      this.freq=new Uint8Array(this.analyser.frequencyBinCount);
    }
    await this.context.resume();
  }
  clearStream(){
    this.streamNode?.disconnect();this.streamNode=null;
    this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;
  }
  disconnectFile(){
    this.element.pause();
    if(this.mediaNode)this.mediaNode.disconnect();
  }
  async loadFile(file){
    if(!file)return;
    await this.ensureAudio();
    this.clearStream();this.disconnectFile();
    this.url && URL.revokeObjectURL(this.url);
    this.url=URL.createObjectURL(file);
    this.element.src=this.url;
    if(!this.mediaNode)this.mediaNode=this.context.createMediaElementSource(this.element);
    this.mediaNode.connect(this.analyser);
    // Solo el archivo local se envía al altavoz. Las capturas jamás se duplican.
    this.analyser.disconnect();
    this.analyser.connect(this.context.destination);
    this.mode='file';
    this.onStatus('Archivo: '+file.name);
    try{await this.element.play();}catch{
      this.onStatus('Archivo cargado. Presiona reproducir para iniciar.');
    }
  }
  async setStream(stream,source){
    await this.ensureAudio();
    if(!stream.getAudioTracks().length){
      stream.getTracks().forEach(t=>t.stop());
      throw new Error('No se compartió audio. Selecciona una pestaña y activa «Compartir audio».');
    }
    this.clearStream();this.disconnectFile();
    this.analyser.disconnect();
    this.stream=stream;
    const audioOnly=new MediaStream(stream.getAudioTracks());
    this.streamNode=this.context.createMediaStreamSource(audioOnly);
    this.streamNode.connect(this.analyser);
    stream.getAudioTracks()[0].addEventListener('ended',()=>this.stop());
    stream.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>this.stop()));
    this.mode=source;
    this.onStatus(source==='tab' ? 'Analizando audio de la pestaña compartida' : 'Micrófono activo');
  }
  async captureTab(){
    if(!navigator.mediaDevices?.getDisplayMedia)throw new Error('La captura de pestaña requiere HTTPS o localhost y un navegador compatible.');
    const stream=await navigator.mediaDevices.getDisplayMedia({
      video:true,
      audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},
      preferCurrentTab:false,
      systemAudio:'include',
    });
    await this.setStream(stream,'tab');
  }
  async captureMic(){
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('El micrófono necesita HTTPS o localhost.');
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    await this.setStream(stream,'mic');
  }
  stop(){
    this.clearStream();this.disconnectFile();
    this.mode='idle';this.onStatus('Sin audio · modo ambiente');
  }
  sample(){
    if(!this.analyser||this.mode==='idle'||(this.mode==='file'&&this.element.paused)){
      for(const k of ['bass','mid','treble','level'])this.smoothed[k]*=.96;
      return this.smoothed;
    }
    this.analyser.getByteFrequencyData(this.freq);
    const avg=(lo,hi)=>{
      let sum=0;
      for(let i=lo;i<hi;i++)sum+=this.freq[i];
      return sum/(hi-lo)/255;
    };
    // 1024 FFT a 44.1/48 kHz: grupos aproximados, no detección de beats.
    const bass=avg(1,10),mid=avg(10,90),treble=avg(90,250);
    const values={bass:Math.min(1,bass*1.65),mid:Math.min(1,mid*1.85),treble:Math.min(1,treble*2.5),level:(bass+mid+treble)/3};
    for(const k of Object.keys(values))this.smoothed[k]+=(values[k]-this.smoothed[k])*.17;
    return this.smoothed;
  }
}
