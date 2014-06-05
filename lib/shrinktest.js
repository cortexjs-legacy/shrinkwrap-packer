var shrinked = require('shrinked');


shrinked("/Users/spud/Product/neurons/mbox/cortex-shrinkwrap.json",{
  dependencyKeys:["engines","dependencies","asyncDependencies"]
},function(err,tree){
  if(err){throw err;}

  console.log(JSON.stringify(tree,null,2));
});