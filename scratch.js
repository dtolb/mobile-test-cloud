var bash = 'git clone -b LIBRE-2116-dtmf-after-call-connects git@github.com:inetCatapult/jailbreak-android.git /Users/dtolbert/code/mobile-test-cloud/tmp';
function cb(err, out, code) {
if (err) {
console.log('err');
console.log(err);
console.log('-------------------------');
}
if(out) {
console.log('out');
console.log(out);
console.log('-------------------------');
}
if(code) {
console.log('code');
console.log(code);
console.log('-------------------------');
}
}
exec(bash,cb);

var glob = require('glob');
var opts = {
cwd: './../'
};
var g = glob.sync('mtc_config.json', opts);
