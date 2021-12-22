import * as THREE from './libs/three125/three.module.js';
import { GLTFLoader } from './libs/three/jsm/GLTFLoader.js';
import { RGBELoader } from './libs/three/jsm/RGBELoader.js';
import { ARButton } from './libs/ARButton.js';
import { LoadingBar } from './libs/LoadingBar.js';
import { ControllerGestures } from './libs/three125/ControllerGestures.js';
import { Player } from './libs/three125/Player.js';
//import { ControllerGestures } from '../../libs/three125/ControllerGestures.js'; 
//import { Player } from '../../libs/three125/Player.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;

		this.assetsPath = './assets/ar-shop/';
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		this.camera.position.set( 0, 1.6, 0 );
        
		this.scene = new THREE.Scene();

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        this.setEnvironment();
        
        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );
        
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );
        
        this.setupXR();
		
		window.addEventListener('resize', this.resize.bind(this) );
        
	}
    
    setupXR(){
        this.renderer.xr.enabled = true;
        
        if ( 'xr' in navigator ) {

			navigator.xr.isSessionSupported( 'immersive-ar' ).then( ( supported ) => {

                if (supported){
                    const collection = document.getElementsByClassName("ar-button");
                    [...collection].forEach( el => {
                        el.style.display = 'block';
                    });
                }
			} );
            
		} 
        
        const self = this;

        this.hitTestSourceRequested = false;
        this.hitTestSource = null;
        
        function onSelect() {
            if (self.chair===undefined) return;
            
            if (self.reticle.visible){
                self.chair.position.setFromMatrixPosition( self.reticle.matrix );
                self.chair.visible = true;
            }
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        
        this.scene.add( this.controller );
    }
	
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight ); 
    }
    
    setEnvironment(){
        const loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        const self = this;
        
        loader.load( './assets/hdr/venice_sunset_1k.hdr', ( texture ) => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          self.scene.environment = envMap;

        }, undefined, (err)=>{
            console.error( 'An error occurred setting the environment');
        } );
    }
    
	showChair(id){
        this.initAR();
        
		const loader = new GLTFLoader( ).setPath(this.assetsPath);
        const self = this;
        
        this.loadingBar.visible = true;
		
		// Load a glTF resource
		loader.load(
			// resource URL
			`chair${id}.glb`,
			// called when the resource is loaded
			function ( gltf ) {

				self.scene.add( gltf.scene );
                self.chair = gltf.scene;
        
                self.chair.visible = false; 
                
                self.loadingBar.visible = false;
                
                // knight
                const options = {
					object: object,
					speed: 0.5,
					animations: gltf.animations,
					clip: gltf.animations[0],
					app: self,
					name: 'chair${id}',
					npc: false
				};
				
				self.knight = new Player(options);
                self.knight.object.visible = false;
				
				//self.knight.action = 'Dance';
				const scale = 0.003;
				self.knight.object.scale.set(scale, scale, scale); 
				

                // gesture start

                this.gestures = new ControllerGestures( this.renderer );
                this.gestures.addEventListener( 'tap', (ev)=>{
                    console.log( 'tap' ); 
                    self.ui.updateElement('info', 'tap' );
                    if (!self.knight.object.visible){
                        self.knight.object.visible = true;
                        self.knight.object.position.set( 0, -0.3, -0.5 ).add( ev.position );
                        self.scene.add( self.knight.object ); 
                    }
                });
                this.gestures.addEventListener( 'doubletap', (ev)=>{
                    //console.log( 'doubletap'); 
                    //self.ui.updateElement('info', 'doubletap' );
                });
                this.gestures.addEventListener( 'press', (ev)=>{
                    //console.log( 'press' );    
                   // self.ui.updateElement('info', 'press' );
                });
                this.gestures.addEventListener( 'pan', (ev)=>{
                    //console.log( ev );
                    if (ev.initialise !== undefined){
                        self.startPosition = self.knight.object.position.clone();
                    }else{
                        const pos = self.startPosition.clone().add( ev.delta.multiplyScalar(3) );
                        self.knight.object.position.copy( pos );
                        //self.ui.updateElement('info', `pan x:${ev.delta.x.toFixed(3)}, y:${ev.delta.y.toFixed(3)}, x:${ev.delta.z.toFixed(3)}` );
                    } 
                });
                this.gestures.addEventListener( 'swipe', (ev)=>{
                    //console.log( ev );   
                    self.ui.updateElement('info', `swipe ${ev.direction}` );
                    if (self.knight.object.visible){
                        self.knight.object.visible = false;
                        self.scene.remove( self.knight.object ); 
                    }
                });
                this.gestures.addEventListener( 'pinch', (ev)=>{
                    //console.log( ev );  
                    if (ev.initialise !== undefined){
                        self.startScale = self.knight.object.scale.clone();
                    }else{
                        const scale = self.startScale.clone().multiplyScalar(ev.scale);
                        self.knight.object.scale.copy( scale );
                      //  self.ui.updateElement('info', `pinch delta:${ev.delta.toFixed(3)} scale:${ev.scale.toFixed(2)}` );
                    }
                });
                this.gestures.addEventListener( 'rotate', (ev)=>{
                    //      sconsole.log( ev ); 
                    if (ev.initialise !== undefined){
                        self.startQuaternion = self.knight.object.quaternion.clone();
                    }else{
                        self.knight.object.quaternion.copy( self.startQuaternion );
                        self.knight.object.rotateY( ev.theta );
                     //   self.ui.updateElement('info', `rotate ${ev.theta.toFixed(3)}`  );
                    }
                });

              //  gesture end


                self.renderer.setAnimationLoop( self.render.bind(self) );
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

			}
		);
	}			
    
    initAR(){
        let currentSession = null;
        const self = this;
        
        const sessionInit = { requiredFeatures: [ 'hit-test' ] };
        
        
        function onSessionStarted( session ) {

            session.addEventListener( 'end', onSessionEnded );

            self.renderer.xr.setReferenceSpaceType( 'local' );
            self.renderer.xr.setSession( session );
       
            currentSession = session;
            
        }

        function onSessionEnded( ) {

            currentSession.removeEventListener( 'end', onSessionEnded );

            currentSession = null;
            
            if (self.chair !== null){
                self.scene.remove( self.chair );
                self.chair = null;
            }
            
            self.renderer.setAnimationLoop( null );

        }

        if ( currentSession === null ) {

            navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

        } else {

            currentSession.end();

        }
    }
    
    requestHitTestSource(){
        const self = this;
        
        const session = this.renderer.xr.getSession();

        session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
            
            session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

                self.hitTestSource = source;

            } );

        } );

        session.addEventListener( 'end', function () {

            self.hitTestSourceRequested = false;
            self.hitTestSource = null;
            self.referenceSpace = null;

        } );

        this.hitTestSourceRequested = true;

    }
    
    getHitTestResults( frame ){
        const hitTestResults = frame.getHitTestResults( this.hitTestSource );

        if ( hitTestResults.length ) {
            
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const hit = hitTestResults[ 0 ];
            const pose = hit.getPose( referenceSpace );

            this.reticle.visible = true;
            this.reticle.matrix.fromArray( pose.transform.matrix );

        } else {

            this.reticle.visible = false;

        }

    }
    
	render( timestamp, frame ) {

        if ( frame ) {
            if ( this.hitTestSourceRequested === false ) this.requestHitTestSource( )

            if ( this.hitTestSource ) this.getHitTestResults( frame );
        }

       // const dt = this.clock.getDelta();
        this.stats.update();
        if ( this.renderer.xr.isPresenting ){
            this.gestures.update();
            //this.ui.update();
        }

        if ( this.knight !== undefined ) this.knight.update(dt);

        this.renderer.render( this.scene, this.camera );

    }
}

export { App };