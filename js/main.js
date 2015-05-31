// templates
var source = $('#tmplgistlist').html();
var template = Handlebars.compile(source);
var source = $('#tmplmaingist').html();
var gisttmpl = Handlebars.compile(source);

//get hash
var visor = window.location.search.substring(1);

// global
var reposarray = {}

$(document).ready(function() {
	// config
	configFile = localStorage.getItem("configFile")
	if(configFile===null){
		checkConfig()
	}else{
		checkUid(JSON.parse(configFile))
		// checkTags(JSON.parse(configFile))
	}

});

function checkConfig(){
	$.getJSON( "config.json", function( data ) {
		configFile = JSON.stringify(data)
		localStorage.setItem('configFile', configFile);
		checkUid(data)
		//checkTags(data)
	});
}

function checkUid(config){
	usrurl = 'https://api.github.com/users/' + config.user
	userId = localStorage.getItem(usrurl)
	if (userId === null) {
		goGet(usrurl + '?callback=storeid')
	}else{
		checkGists()
	}
}

function storeid(response){
	if(response.meta.status==404){
		console.log('user 404')
		// $('#userlost').show()
	}else{
		userId = JSON.stringify(response)
		localStorage.setItem(usrurl, userId);
		checkGists()
	}
}

function goGet(url){
	console.log(url)
	$.ajax({
		url: url,
		type: 'GET',
		error: function(xhr) { console.log('err',arguments) },
		beforeSend: setHeader
    });
}

function setHeader(xhr) {
	xhr.setRequestHeader('Accept', 'application/vnd.github.v3.full+json');
}

function checkGists(){

	// createFirsturl();
	var idutente = JSON.parse(userId).data.id
	// get url
	// var url = 'user/' + idutente + '/gists'
	var url = 'users/' + JSON.parse(configFile).user + '/gists'
	firsturl = gourl = "https://api.github.com/" + url + "?callback=foo"
	updateurl = "https://api.github.com/" + url + "?callback=update"
	// createFirsturl() end

	paginaLetta = localStorage.getItem(firsturl)
	if(paginaLetta===null){
		// begin recursive requests
		goGet(firsturl) // callback=foo
	}else{
		goGet(updateurl)
	}
}

// function createFirsturl(){
// 	var idutente = JSON.parse(userId).data.id
// 	// get url
// 	// var url = 'user/' + idutente + '/gists'
// 	var url = 'users/' + JSON.parse(configFile).user + '/gists'
// 	firsturl = gourl = "https://api.github.com/" + url + "?callback=foo&page=1"
// 	updateurl = "https://api.github.com/" + url + "?callback=update"
// }

function foo(response){
	var api = JSON.stringify(response)
	localStorage.setItem(gourl, api);
	found=0;
	for (var i in response.meta.Link){
		if(response.meta.Link[i][1].rel=='next'){
			found=1; gourl=response.meta.Link[i][0]
			goGet(gourl)
		}
	}
	// check 'next' not found (was last page)
	if(!found)renderGists(localStorage.getItem(firsturl))
}

function update(response){
	var api = JSON.stringify(response)
	if(api!=localStorage.getItem(firsturl)){
		localStorage.removeItem(firsturl)
		checkGists()
	}else{
		renderGists(localStorage.getItem(firsturl))
	}
}

function renderGists(pagina){ // call by pagination click too
	$('#cont').html('').scrollTop()
	var resp = JSON.parse(pagina).data
	var meta = JSON.parse(pagina).meta
	var first=1
	for (var key in resp) {
		if (resp.hasOwnProperty(key)) {
			var obj = resp[key];
			var filearr = Object.keys(obj.files);
			var found=0
			for (var i in filearr) {
				var splitted = filearr[i].split('.');
				var terms = splitted[0].split('-')
				if( !$.inArray('gamma', terms) ){
					terms.splice( $.inArray('gamma', terms), 1 )// togli 'gamma'
					found=1
				}
			};
			if ( found ) {
				obj.taglist = terms
				obj.filearray = filearr
				obj.real_time = Reduce(obj.created_at)
				reposarray[obj.id]=obj
				if(first==1){
					primagist=obj.id
					first++ // was a bug
				}else{
					//$('#gistlist').append( template( obj ) )
				}
			}
			// obj.tags=[]
			// if(typeof repototag[obj.id] !== 'undefined'){
			// 	// for (j in repototag[obj.id]) {
			// 	// 	tagstring+=repototag[obj.id][j]
			// 	// }
			// 	obj.tags=repototag[obj.id]
			// }
			// $('#cont').append(Mustache.render(template, obj))
		}
	}
	// // ADD PAGINATION DIV
	// var pagination = $('<ul/>')
	// for (var i in meta.Link){
	// 	pagination.prepend($('<li/>').append($('<a/>', { text: meta.Link[i][1].rel, href: meta.Link[i][0] })))
	// }
	// $('#contpag').append($('<div/>', {'class': 'pagination'}).prepend(pagination))
	// // WE ARE DONE
	if(visor==''){
		mainRepo = reposarray[primagist]
		renderPage(primagist)
		delete reposarray[primagist];
	} else {
		mainRepo = reposarray[visor]
		renderPage(visor)
		delete reposarray[visor];
	}
}

function renderPage(gistid){
	goGet('https://api.github.com/gists/'+gistid+'?callback=gomain')
}

function gomain(response){
	var pointer = mainRepo.filearray
	var outarray = []
	for (var i in pointer) {
		var c = response.data.files[pointer[i]].content
		var l = response.data.files[pointer[i]].language
		// use extention
		var splt = pointer[i].split('.');
		switch(l.toLowerCase()) {
			case 'markdown':
				var converter = new Showdown.converter();
				var deliver = converter.makeHtml(c)
				break;
			case 'html':
				var encodedStr = c.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
  					return '&#' + i.charCodeAt(0) + ';';
				});
				var deliver = '<pre><code class="' + splt[1] + '">' + encodedStr + '</code></pre>'
				break;
			//case 'JavaScript':
			//case 'Shell':
			default:
				var deliver = '<pre><code class="' + splt[1] + '">' + c + '</code></pre>'
				break;
		}
		outarray.push({segment: pointer[i], content: deliver })
	};
	mainRepo.contents = outarray
	$('title').text(mainRepo.description)
	$('#maingist').append( gisttmpl( mainRepo ) )
	hljs.configure({languages: []}) //{languages: ['js','bash']}
	$('pre code').each(function(i, block) {
	    hljs.highlightBlock(block);
	});
	$('#gistlist').append( template( reposarray ) )
}

function Reduce(time){
	return new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")).toISOString().slice(0, 20)
}
