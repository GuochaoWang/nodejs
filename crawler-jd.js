var Crawler = require("crawler");
var fs = require('fs');
//var Iconv = require('iconv').Iconv;

var filename = "beijing";
var jddata = [];
var maxpage = 20;
var currpage = 1;

function checkCsvEmpty(val) {
    if (val && val != "") {
        return val.trim();
    }
    return "null";
}
function pushJdData(obj) {
    obj.data.scene_list.forEach(function (i) {
        jddata.push({
            surl: i.surl,
            sname: i.sname,
            map_x: i.ext.map_x,
            map_y: i.ext.map_y,
            map_info: i.ext.map_info,
            en_sname: i.ext.en_sname,
            alias: i.ext.alias,
            address: i.ext.address,
            pic_url: i.cover.pic_url,
            full_url: i.cover.full_url,
        });
    });
}

function saveDataToCsv() {
    var writeStream = fs.createWriteStream(filename + ".csv", { 'encoding': 'utf8' });

    var data = "surl" +
        "," +
        ",sname" +
        "," +
        "map_x" +
        "," +
        "map_y" +
        "," +
        "map_info" +
        "," +
        "en_sname" +
        "," +
        "alias" +
        "," +
        "address" +
        "," +
        "pic_url" +
        "," +
        "full_url" +
        "\n";
    
    
    for (var i = 0; i < jddata.length; i++) {
        data += checkCsvEmpty(jddata[i].surl) +
            "," +
            checkCsvEmpty(jddata[i].sname) +
            "," +
            checkCsvEmpty(jddata[i].map_x) +
            "," +
            checkCsvEmpty(jddata[i].map_y) +
            "," +
            checkCsvEmpty(jddata[i].map_info) +
            "," +
            checkCsvEmpty(jddata[i].en_sname) +
            "," +
            checkCsvEmpty(jddata[i].alias) +
            "," +
            checkCsvEmpty(jddata[i].address) +
            "," +
            checkCsvEmpty(jddata[i].pic_url) +
            "," +
            checkCsvEmpty(jddata[i].full_url) +
            "\n";
        //console.log(i);
    }
    
    //writeStream.write(iconv.convert(data));
    writeStream.write(data);

    writeStream.close();
}

var c = new Crawler({
    rateLimit: 5000, // `maxConnections` will be forced to 1
    //maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            var $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            //console.log($.text());
            var json = $.text();
            var obj = JSON.parse($.text());

            pushJdData(obj);

            console.log(currpage);

            currpage++;

            //{ "errno":0, "msg": "", "data":{ "surl":"", "sname":"", "ext":["map_x":456,"map_y":569, "map_info"], "scene_list":[{ "surl":"", "sname":"", "ext":["map_x":456,"map_y":569, "map_info", "alias":"", "en_sname":"", "address":"","phone":"",""],"cover":{"pic_url":"", "full_url":""}  }] }

            if (currpage > maxpage) {
                saveDataToCsv();
            }
        }
        done();
    }
});

// Queue just one URL, with default callback
for (var i = currpage; i <= maxpage; i++) {
    c.queue('http://lvyou.baidu.com/destination/ajax/jingdian?format=ajax&cid=0&playid=0&seasonid=5&surl=' +
        filename +
        '&pn=' +
        i +
        '&rn=18');
}


