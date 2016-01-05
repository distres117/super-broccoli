var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var keys = require('./keys.js');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(keys.mandrill);


// var fieldMap = {
//   firstName: "FIRST_NAME",
//   numMonthsSinceContact: "NUM_MONTHS_SINCE_CONTACT"
// };

var client = tumblr.createClient(keys.tumblr);
client.posts('distres117.tumblr.com', function(err,blog){
  var now = Date.now() - (90 * (1000 * 60 * 60 * 24)); //90 days before today
  var posts = blog.posts.filter(function(post){
    var postDate = post.date.split(" ");
    var postDateComp = Date.parse(postDate[0] + "T" + postDate[1]);
    if (postDateComp > now)
      return post;
  });
  var data = csvParse("friend_list.csv");
  for (var i in data){
    data[i].latestPosts = posts;
    var html = populateEjs("email_template.html", data[i]);
    console.log(html);
    sendEmail(
      data[i].firstName + " " + data[i].lastName,
      data[i].emailAddress,
      "Oliver McRobbie",
      "omcrobbie@gmail.com",
      "Amazing, awesome autogenerated spam email!",
      html
    );
  }
});

//for (var i in data)
  //console.log(populate("email_template.html", data[i], fieldMap ));
  //console.log(populateEjs("email_template.html", data[i]));
//console.log(emails[0]);

function csvParse(data){
  var csvFile = fs.readFileSync(data, "utf8");
  var rows = csvFile.split("\n");
  var header = rows[0].split(",");
  var dataRows = rows.slice(1);
  var rtn = [];
  for(var row in dataRows){
    var obj = {};
    var rowSp = dataRows[row].split(",");
    for (var i in rowSp){
      obj[header[i]] = rowSp[i];
    }
    if (Object.keys(obj).some(k=>obj[k]))
      rtn.push(obj);
  }
  return rtn;
}

function populateEjs(template, data){
  var template = fs.readFileSync(template, "utf8");
  var email = ejs.render(template, data);
  return email;
}

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        console.log(result);
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }

// function populate(template, csvObj, fieldMap){
//   var template = fs.readFileSync(template, "utf8");
//   for (var k in fieldMap)
//     template = template.replace(fieldMap[k], csvObj[k]);
//   return template;
// }
