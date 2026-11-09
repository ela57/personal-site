import * as THREE from '../vendor/three.module.min.js';

export function createAntialiasing(renderer) {
  const size = new THREE.Vector2();
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: renderer.capabilities.isWebGL2 && renderer.extensions.has('EXT_color_buffer_float') ? THREE.HalfFloatType : THREE.UnsignedByteType,
    depthBuffer: true, stencilBuffer: false
  });
  const material = new THREE.ShaderMaterial({
    uniforms: { image: { value: target.texture }, texel: { value: new THREE.Vector2(1, 1) } },
    depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 sampleUv;void main(){sampleUv=uv;gl_Position=vec4(position,1.);}',
    fragmentShader: `uniform sampler2D image;uniform vec2 texel;varying vec2 sampleUv;
      void main(){
        vec3 nw=texture2D(image,sampleUv+vec2(-1.,-1.)*texel).rgb;
        vec3 ne=texture2D(image,sampleUv+vec2(1.,-1.)*texel).rgb;
        vec3 sw=texture2D(image,sampleUv+vec2(-1.,1.)*texel).rgb;
        vec3 se=texture2D(image,sampleUv+vec2(1.,1.)*texel).rgb;
        vec3 center=texture2D(image,sampleUv).rgb;
        vec3 weights=vec3(.299,.587,.114);
        float a=dot(nw,weights),b=dot(ne,weights),c=dot(sw,weights),d=dot(se,weights),m=dot(center,weights);
        float low=min(m,min(min(a,b),min(c,d))),high=max(m,max(max(a,b),max(c,d)));
        vec2 direction=vec2(-((a+b)-(c+d)),(a+c)-(b+d));
        float reduce=max((a+b+c+d)*.03125,.0078125);
        direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduce),vec2(-6.),vec2(6.))*texel;
        vec3 first=.5*(texture2D(image,sampleUv-direction/6.).rgb+texture2D(image,sampleUv+direction/6.).rgb);
        vec3 second=first*.5+.25*(texture2D(image,sampleUv-direction*.5).rgb+texture2D(image,sampleUv+direction*.5).rgb);
        float luma=dot(second,weights);
        vec3 filtered=(luma<low||luma>high)?first:second;
        gl_FragColor=vec4((high-low)<max(.025,high*.08)?center:filtered,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const scene = new THREE.Scene();
  const triangle = new THREE.BufferGeometry();
  triangle.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  triangle.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const screen = new THREE.Mesh(triangle, material); screen.frustumCulled = false; scene.add(screen);
  const camera = new THREE.Camera();
  return {
    render(world, view) {
      renderer.getDrawingBufferSize(size);
      if (target.width !== size.x || target.height !== size.y) {
        target.setSize(size.x, size.y);
        material.uniforms.texel.value.set(1 / size.x, 1 / size.y);
      }
      renderer.setRenderTarget(target); renderer.render(world, view);
      const calls = renderer.info.render.calls;
      renderer.setRenderTarget(null); renderer.render(scene, camera);
      return calls + 1;
    }
  };
}
