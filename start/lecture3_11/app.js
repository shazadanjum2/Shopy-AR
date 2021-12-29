import * as THREE from '../../libs/three125/three.module.js';
import { OrbitControls } from '../../libs/three125/OrbitControls.js';
import { GLTFLoader } from '../../libs/three125/GLTFLoader.js';

import { Stats } from '../../libs/stats.module.js';
import { CanvasUI } from '../../libs/three125/CanvasUI.js'
import { ARButton } from '../../libs/ARButton.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { Player } from '../../libs/three125/Player.js';
import { ControllerGestures } from '../../libs/three125/ControllerGestures.js'; 

class App{
	constructor(id){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		//this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 20 );
        this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 20 );//0.01

		this.scene = new THREE.Scene();
        
        this.scene.add(this.camera);
       
		this.scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 ).normalize();
		this.scene.add( light );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 3.5, 0);

        this.controls.update();
        
        this.stats = new Stats();
        document.body.appendChild( this.stats.dom );
        
        this.origin = new THREE.Vector3();
        this.euler = new THREE.Euler();
        this.quaternion = new THREE.Quaternion();
        
        this.initScene(id);
        this.setupXR(id);
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene(id){
        this.loadingBar = new LoadingBar();
        
        this.assetsPath = '../../assets/ar-shop/';//ar-shop
        const loader = new GLTFLoader().setPath(this.assetsPath);
		const self = this;
		
		// Load a GLTF resource
		loader.load(
			// resource URL
			//`knight2.glb`,
            //`office-chair.glb`,
            //`chair1.glb`,
            `${id}.glb`,
			// called when the resource is loaded
			function ( gltf ) {
				//const object = gltf.scene.children[5];
                let length = gltf.scene.children.length;
                console.log( length);
                console.log( gltf.scene.children);

                const object=gltf.scene.children[length-1];

                //if(gltf.scene.children[8].)

				// object.traverse(function(child){
				// 	if (child.isMesh){
                //         child.material.metalness = 0;
                //         child.material.roughness = 1;
				// 	}
				// });
                object.traverse(function(child){
					if (child.isMesh){
                        child.material.metalness = 0;
                        child.material.roughness = 1;
                        //console.log('Mesh child');

					} 
                    // else if(child=='Object3D'){
                    //         object = child;
                    //         console.log('3d object');
                    // }
				});
				
                

				const options = {
					object: object,
					speed: 0.5,
					// animations: gltf.animations,
					// clip: gltf.animations[0],
					app: self,
					name: 'knight',
					npc: false
				};
				
				self.knight = new Player(options);
                self.knight.object.visible = false;
				
				//self.knight.action = 'Dance';
				//const scale = 0.003;
                //const scale = 0.03;

                if("chair1"==id || "chair4"==id  || "chair6"==id ){
                    const scale = 2;
				    self.knight.object.scale.set(scale, scale, scale);
                }else if("dining_chair"==id){
                    const scale = 0.2;
				    self.knight.object.scale.set(scale, scale, scale);
                } else if("midcentury2"==id){
                    const scale = 3;
				    self.knight.object.scale.set(scale, scale, scale);
                }else if("wingchair"==id){
                    const scale = 0.03;
				    self.knight.object.scale.set(scale, scale, scale);
                }else if("table"==id){
                    const scale = 0.1;
				    self.knight.object.scale.set(scale, scale, scale);
                } else if("threeseater"==id ){
                    const scale = 0.8;
				    self.knight.object.scale.set(scale, scale, scale);
                } else if("blackbeauty"==id){
                    const scale = 0.3;
				    self.knight.object.scale.set(scale, scale, scale);
                }
                else{
                    const scale = 0.03;
				    self.knight.object.scale.set(scale, scale, scale);
                }
                



                 
				
                self.loadingBar.visible = false;
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);

			},
			// called when loading has errors
			function ( error ) {

				//console.log( 'An error happened' );

                console.log( console.error() );
			}
		);
        
        this.createUI();
    }





    
    createUI() {
        
        const config = {
            panelSize: { width: 0.15, height: 0.038 },
            height: 128,
            info:{ type: "text" }
        }
        const content = {
            info: "Debug info"
        }
        
        const ui = new CanvasUI( content, config );
        
        this.ui = ui;
    }
    
    setupXR(id){
        this.renderer.xr.enabled = true; 
        
        const self = this;
        let controller, controller1;
        
        function onSessionStart(){
            self.ui.mesh.position.set( 0, -0.15, -0.3 );
            self.camera.add( self.ui.mesh );
        }
        
        function onSessionEnd(){
            self.camera.remove( self.ui.mesh );
        }
        
        const btn = new ARButton( this.renderer, { onSessionStart, onSessionEnd });//, sessionInit: { optionalFeatures: [ 'dom-overlay' ], domOverlay: { root: document.body } } } );
        
        this.gestures = new ControllerGestures( this.renderer );
        this.gestures.addEventListener( 'tap', (ev)=>{
            console.log( 'tap' ); 
            self.ui.updateElement('info', 'tap' );
            if (!self.knight.object.visible){
                self.knight.object.visible = true;
                //self.knight.object.position.set( 0, -0.3, -0.5 ).add( ev.position );

                // self.knight.object.position.set( 0, -1, -4 ).add( ev.position );
                // self.knight.object.rotateX( 1.5 );
                
                if("chair1"==id || "chair4"==id || "chair6"==id ){

                    self.knight.object.position.set( 0, -1, -3 ).add( ev.position );
                    self.knight.object.rotateX( 1.5 );
                          
                } else if("dining_chair"==id){
                    self.knight.object.position.set( 0, -1, -3 ).add( ev.position );
                    self.knight.object.rotateX( 1.5 );

                    self.knight.object.rotateZ( 2.5 );

                } else if("blackbeauty"==id ){

                    self.knight.object.position.set( 0, -1, -4 ).add( ev.position );
                    self.knight.object.rotateX( 1.5 );
                    
                    self.knight.object.rotateZ( 5 );
                }  else if("wingchair"==id){
                    self.knight.object.position.set( 0, -1, -3 ).add( ev.position );
                    self.knight.object.rotateX( 1.5 );
                } else if("midcentury2"==id){
                    self.knight.object.position.set( 0, -3, -5 ).add( ev.position );
                    self.knight.object.rotateX( 1.5 );
                }
                else if("table"==id){
                    self.knight.object.position.set( 0, -2, -5 ).add( ev.position );
                    self.knight.object.rotateX( 1.5 );
                } else if("threeseater"==id ){

                    self.knight.object.position.set( 0, -1, -4 ).add( ev.position );
                    self.knight.object.rotateX( 1.5 );
                          
                }
                else{
                    self.knight.object.position.set( 0, -1, -5 ).add( ev.position );
                    self.knight.object.rotateX( 1.5 );
                }

                
                

                self.scene.add( self.knight.object ); 
            }
        });
        this.gestures.addEventListener( 'doubletap', (ev)=>{
            //console.log( 'doubletap'); 
            self.ui.updateElement('info', 'doubletap' );
        });
        this.gestures.addEventListener( 'press', (ev)=>{
            //console.log( 'press' );    
            self.ui.updateElement('info', 'press' );
        });
        this.gestures.addEventListener( 'pan', (ev)=>{
            //console.log( ev );
            if (ev.initialise !== undefined){
                self.startPosition = self.knight.object.position.clone();
            }else{
                const pos = self.startPosition.clone().add( ev.delta.multiplyScalar(3) );
                self.knight.object.position.copy( pos );
                self.ui.updateElement('info', `pan x:${ev.delta.x.toFixed(3)}, y:${ev.delta.y.toFixed(3)}, x:${ev.delta.z.toFixed(3)}` );
            } 
        });
        this.gestures.addEventListener( 'swipe', (ev)=>{
            //console.log( ev );   
            // self.ui.updateElement('info', `swipe ${ev.direction}` );
            // if (self.knight.object.visible){
            //     self.knight.object.visible = false;
            //     self.scene.remove( self.knight.object ); 
            // }
        });
        this.gestures.addEventListener( 'pinch', (ev)=>{
            //console.log( ev );  
            if (ev.initialise !== undefined){
                self.startScale = self.knight.object.scale.clone();
            }else{
                const scale = self.startScale.clone().multiplyScalar(ev.scale);
                self.knight.object.scale.copy( scale );
                self.ui.updateElement('info', `pinch delta:${ev.delta.toFixed(3)} scale:${ev.scale.toFixed(2)}` );
            }
        });
        this.gestures.addEventListener( 'rotate', (ev)=>{
            //      sconsole.log( ev ); 
            if (ev.initialise !== undefined){
                self.startQuaternion = self.knight.object.quaternion.clone();
            }else{
                self.knight.object.quaternion.copy( self.startQuaternion );
                //self.knight.object.rotateY( ev.theta );
                self.knight.object.rotateZ( ev.theta );

                self.ui.updateElement('info', `rotate ${ev.theta.toFixed(3)}`  );
            }
        });
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        const dt = this.clock.getDelta();
        this.stats.update();
        if ( this.renderer.xr.isPresenting ){
            this.gestures.update();
            this.ui.update();
        }
        if ( this.knight !== undefined ) this.knight.update(dt);
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };