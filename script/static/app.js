const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const axios = require('axios');
const iconv = require('iconv-lite');
const { ObjectID } = require('mongodb');
const { MongoClass } = require('../../utils/mongo');
const Entities = require('html-entities').XmlEntities;
const to_json = require('xmljson').to_json;
const entitiesCode = new Entities();
const { mixinsScriptConfig, getBjDate, dateStringify } = require('../../utils/tools')

// 封装一手request方法
async function http(url){
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(undefined)
		}, 50000);
		axios({
			method: 'GET',
			url: url,
			timeout: 50000,
		})
		.then(res => {
			if(res && res.status === 200){
				resolve(res)
			}else{
				resolve(undefined)
			}
		})
		.catch(err => {
			resolve(undefined)
		})
	})
	.catch(err => {
		console.log(url);
	})
}
// 导出
let mainFn = async (DB) => {
	// 如果正在运行，直接退出，确保安全
	let curConfPath = path.resolve(__dirname, './config.json');
	let runConf = fse.readJsonSync(curConfPath);
	if(runConf.state){
		process.exit();
	}
	// 箭头函数 与 promise = 狗币
	return new Promise(async (resolve, reject) => {

		let Sconfig = runConf;
	   	// 最大采集时间
	   	setTimeout(() => {
	   		reject();
	   	}, Sconfig.timeout);
	   	// 正常
	   	let videoInfoColl = DB.collection('video_info');
	   	let otherColl = DB.collection('other');
	   	let confColl = DB.collection('config');

	   	let configData = await confColl.findOne({}); //
		let isBJtime = configData.isBjTime;          //
		let cachePath = path.resolve(__dirname, '../../static/cache');
		let domain = Sconfig.options.domain.val;

		// 开始采集 => 配置中保存当前子进程的pid，用于手动停止
	   	// 开始采集 => 保存当前运行脚本时间
	   	// 开始采集 => 脚本状态设置为已启动
	   	mixinsScriptConfig('static', {state: true, pid: process.pid, runTime: dateStringify(isBJtime)});

		// 首页
		if(Sconfig.options.home.val){
		   	await new Promise(async (res, rej) => {
		   		let indexRes = await http(`${domain}/index.html`);
			   	if(indexRes.status === 200){
			   		let indexFilePath = path.resolve(cachePath, './index.html');
			   		fse.writeFileSync(indexFilePath, indexRes.data);
			   	}
			   	res();
		   	}).catch((err) => {
		   		console.log('首页文件生成发生错误');
		   	});
		}
	   	// 分类
	   	if(Sconfig.options.nav.val){
		   	await new Promise(async (res, rej) => {
		   		let allTopNavList = await otherColl.find({type: 'nav_type', parent_id: false, display: true}).toArray();
		   		for(let arg of allTopNavList){
			   		let curNavRes = await http(`${domain}/nav/${arg._id}.html`);
				   	if(curNavRes.status === 200){
				   		let navCatPath = path.resolve(cachePath, './nav');
				   		let navCatExist = fse.existsSync(navCatPath);
				   		if(!navCatExist){
				   			fse.mkdirSync(navCatPath);
				   		}
				   		let curNavFilePath = path.resolve(cachePath, `./nav/${arg._id}.html`);
				   		fse.writeFileSync(curNavFilePath, curNavRes.data);
				   		console.log(`/nav/${arg._id}.html`);
				   	}
		   		}
		   		res();
		   	}).catch((err) => {
		   		console.log('分类文件生成发生错误');
		   	});
	   	}
	   	// 所有的详情页
	   	if(Sconfig.options.detill.val){
		   	await new Promise(async (res, rej) => {
		   		let lens = Sconfig.options.lens.val;
		   		let allTopNavList = await otherColl.find({type: 'nav_type', display: true}).toArray();
		   		for(let arg of allTopNavList){
		   			let allVideoList = await videoInfoColl.find({display: true, video_type: arg._id}).sort({rel_time: -1, video_rate: -1, update_time: -1}).limit(lens).toArray();
			   		for(let arg2 of allVideoList){
				   		let curDetillVideoRes = await http(`${domain}/detill/${arg2._id}.html`);
					   	if(curDetillVideoRes.status === 200){
					   		let detillCatPath = path.resolve(cachePath, './detill');
					   		let detillCatExist = fse.existsSync(detillCatPath);
					   		if(!detillCatExist){
					   			fse.mkdirSync(detillCatPath);
					   		}
					   		let curDetillFilePath = path.resolve(cachePath, `./detill/${arg2._id}.html`);
					   		fse.writeFileSync(curDetillFilePath, curDetillVideoRes.data);
					   		console.log(`/detill/${arg2._id}.html`);
					   	}
			   		}
		   		}
		   		res();
		   	}).catch((err) => {
		   		console.log('详情文件生成发生错误');
		   	});
	   	}
	   	// 所有的播放页
	   	if(Sconfig.options.play.val){
		   	await new Promise(async (res, rej) => {
		   		let lens = Sconfig.options.lens.val;
		   		let allTopNavList = await otherColl.find({type: 'nav_type', display: true}).toArray();
		   		for(let arg of allTopNavList){
			   		let allVideoList = await videoInfoColl.find({display: true, video_type: arg._id}).sort({rel_time: -1, video_rate: -1, update_time: -1}).limit(lens).toArray();
			   		for(let arg2 of allVideoList){
				   		let curPlayVideoRes = await http(`${domain}/play/${arg2._id}.html`);
					   	if(curPlayVideoRes.status === 200){
					   		let playCatPath = path.resolve(cachePath, './play');
					   		let playCatExist = fse.existsSync(playCatPath);
					   		if(!playCatExist){
					   			fse.mkdirSync(playCatPath);
					   		}
					   		let curPlayFilePath = path.resolve(cachePath, `./play/${arg2._id}.html`);
					   		fse.writeFileSync(curPlayFilePath, curPlayVideoRes.data);
					   		console.log(`/play/${arg2._id}.html`);
					   	}
			   		}
		   		}
		   		res();
		   	}).catch((err) => {
		   		console.log('播放文件生成发生错误');
		   	});
	   	}

	   	console.log('采集完成！');

		resolve();
	}).then(res => {
		// 把采集状态 改成 停止
		mixinsScriptConfig('static', {state: false});
		// 停止
		process.exit();
	}).catch(err => {
		console.log(err);
		// 把采集状态 改成 停止
		mixinsScriptConfig('static', {state: false});
		// 停止
		process.exit();
	})
}
// mainFn();
MongoClass(mainFn)