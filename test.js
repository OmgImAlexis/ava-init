import path from 'path';
import fs from 'fs';
import tempWrite from 'temp-write';
import dotProp from 'dot-prop';
import test from 'ava';
import fn from './';

const originalArgv = process.argv.slice();
const get = dotProp.get;

function run(pkg) {
	const filepath = tempWrite.sync(JSON.stringify(pkg), 'package.json');

	return fn({
		cwd: path.dirname(filepath),
		skipInstall: true
	}).then(() => JSON.parse(fs.readFileSync(filepath, 'utf8')));
}

test('empty package.json', t => {
	return run({}).then(pkg => {
		t.is(get(pkg, 'scripts.test'), 'ava');
	});
});

test('has scripts', t => {
	return run({
		scripts: {
			start: ''
		}
	}).then(pkg => {
		t.is(get(pkg, 'scripts.test'), 'ava');
	});
});

test('has default test', t => {
	return run({
		scripts: {
			test: 'echo "Error: no test specified" && exit 1'
		}
	}).then(pkg => {
		t.is(get(pkg, 'scripts.test'), 'ava');
	});
});

test('has only AVA', t => {
	return run({
		scripts: {
			test: 'ava'
		}
	}).then(pkg => {
		t.is(get(pkg, 'scripts.test'), 'ava');
	});
});

test('has test', t => {
	return run({
		scripts: {
			test: 'foo'
		}
	}).then(pkg => {
		t.is(get(pkg, 'scripts.test'), 'foo && ava');
	});
});

test('has cli args', t => {
	process.argv = originalArgv.concat(['--init', '--foo']);

	return run({
		scripts: {
			start: ''
		}
	}).then(pkg => {
		process.argv = originalArgv;
		t.is(get(pkg, 'scripts.test'), 'ava --foo');
	});
});

test('has cli args and existing binary', t => {
	process.argv = originalArgv.concat(['--init', '--foo', '--bar']);

	return run({
		scripts: {
			test: 'foo'
		}
	}).then(pkg => {
		process.argv = originalArgv;
		t.is(get(pkg, 'scripts.test'), 'foo && ava --foo --bar');
	});
});

test('installs the AVA dependency', t => {
	const filepath = tempWrite.sync(JSON.stringify({}), 'package.json');

	return fn({
		cwd: path.dirname(filepath)
	}).then(() => {
		t.ok(get(JSON.parse(fs.readFileSync(filepath, 'utf8')), 'devDependencies.ava'));
	});
});
