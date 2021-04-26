const AV = require('leanengine');
const mail = require('./utilities/send-mail');
const Comment = AV.Object.extend('Comment');
const request = require('request');
AV.Cloud.afterSave('Comment', function (request) {
    let currentComment = request.object;

    // 通知站长
    mail.notice(currentComment);

    // AT评论通知
    let pid = currentComment.get('pid');

    if (!pid) {
        console.log("这条评论没有 @ 任何人");
        return;
    }

    // 通过被 @ 的评论 id, 则找到这条评论留下的邮箱并发送通知.
    let query = new AV.Query('Comment');
    query.get(pid).then(function (parentComment) {
        if (parentComment.get('mail')) {
            mail.send(currentComment, parentComment);
        } else {
            console.log(currentComment.get('nick') + " @ 了" + parentComment.get('nick') + ", 但被 @ 的人没留邮箱... 无法通知");
        }
    }, function (error) {
        console.warn('好像 @ 了一个不存在的人!!!');
    });
});

AV.Cloud.define('resend_mails', function (req) {
    let query = new AV.Query(Comment);
    query.greaterThanOrEqualTo('createdAt', new Date(new Date().getTime() - 24 * 60 * 60 * 1000));
    query.notEqualTo('isNotified', true);
    // 如果你的评论量很大，可以适当调高数量限制，最高1000
    query.limit(200);
    return query.find().then(function (results) {
        new Promise((resolve, reject) => {
            count = results.length;
            for (var i = 0; i < results.length; i++) {
                sendNotification(results[i], req.meta.remoteAddress);
            }
            resolve(count);
        }).then((count) => {
            console.log(`昨日${count}条未成功发送的通知邮件处理完毕！`);
        }).catch(() => {

        });
    });
});

AV.Cloud.define('self_wake', function (req) {
    // request(process.env.ADMIN_URL, function (error, response, body) {
    //     console.log('自唤醒任务执行成功，响应状态码为:', response && response.statusCode);
    // });
    // var url = process.env.ADMIN_URL;
    // var requestData = {
    //     comment: "自唤醒信息",
    //     nick: "作者",
    //     mail: "coder.wendell@qq.com",
    //     link: "",
    //     ua: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36",
    //     url: "/contact/",
    //     insertedAt: new Date()
    // };
    // request({
    //     url: url,
    //     method: 'post',
    //     json: true,
    //     headers: {
    //         'x-lc-id': 'BaNJSwA81SiBNsOhUYoHYi7o-gzGzoHsz',
    //         'x-lc-session': '7ro088tmbmyqrptbkizrldyi8',
    //         'x-lc-sign': 'd0ec0cc2579ffb7ae3f064ca6fbf5882,1619362083994',
    //     },
    //     body: JSON.stringify(requestData)
    // }, function(error, response, body) {
    //     console.log(process.env.ADMIN_URL);
    //     console.log(body);
    //     console.log('自唤醒任务执行成功，响应状态码为:', response && response.statusCode);
    //     console.log(JSON.stringify(response));
    // });
    const Comment = AV.Object.extend("Comment");
    const comment = new Comment();
    comment.set('comment', 'self_awake');
    comment.set('nick', 'self_awake');
    comment.set('mail', 'coder.wendell@qq.com');
    comment.set('link', '');
    comment.set('ua', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36');
    comment.set('url', '/contact/');
    comment.set('insertAt', new Date());
    comment.save().then((comment) => {
        console.log('self awake success.');
    }, (error) => {
        console.log(error);
    });


})
