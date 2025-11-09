# MemeHub 类设计文档

## USER-用户

- username：用户名，仅登录用，唯一
- password：密码，仅登录用
- login_token：登录时生成的校验码（未来实现）
- nickname：昵称，创作模因作品的署名，唯一
- coins：模因币数量
- worksList：作品列表
- favoriteList：收藏夹列表
- currencyList：虚拟货币列表，记录购入的虚拟货币的模因对象及货币数量等信息
- status：状态（封禁，正常）


## MEME-模因

- title：模因名，唯一
- imageUrl：模因文件地址
- description：简介
- likes：点赞数量
- likeList：点过赞的用户列表，用id记录
- author：作者
- createdAt：创作时间
- comments：评论区，comment类列表
- status：状态（审核中，正常，封禁）

## COMMENT-评论

- content：评论内容
- meme：模因作品id
- user：发表者的用户id
- createdAt：评论时间
- likes：点赞数
- likeList：点赞用户id列表
- reference：引用的评论id