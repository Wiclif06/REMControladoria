const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
module.exports=function makeLoader(mocks={}){
 const cache=new Map();
 function load(name){
  const file=path.resolve(__dirname,'..',name);
  if(Object.hasOwn(mocks,file))return mocks[file];
  if(cache.has(file))return cache.get(file).exports;
  const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));cache.set(file,m);
  const original=m.require.bind(m);
  m.require=id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id)+(path.extname(id)?'':'.ts')):original(id);
  m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,file);
  return m.exports;
 }return load;
};
