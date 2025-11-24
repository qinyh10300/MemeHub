# MemeHub 类设计文档

## USER-用户

- username：用户名，String，仅登录用，唯一
- password：密码，String，仅登录用
- login_token：登录时生成的校验码，String，（未来实现）
- nickname：昵称，String，创作模因作品的署名，唯一
- coins：模因币数量，Number
- worksList：作品列表，List(Meme)
- favoriteList：收藏夹列表，List(Meme)
- currencyList：虚拟货币列表，List(?)，记录购入的虚拟货币的模因对象及货币数量等信息，（未来实现）
- status：状态，String，（封禁banned，正常active）


## MEME-模因

- title：模因名，String，唯一
- ticker：模因代号，String，唯一
- imageUrl：模因文件地址，String
- description：简介，String
- likes：点赞数量，Number
- likeList：点过赞的用户列表，List，用id记录
- favorites：收藏数量，Number
- author：作者，User
- createdAt：创作时间，Date
- comments：评论区，List(Comment)
- status：状态，String，（审核中pending，正常active，封禁banned）

## COMMENT-评论

- content：评论内容，String
- meme：模因作品id，String
- user：发表者的用户id，String
- createdAt：评论时间，Date
- likes：点赞数，Number
- likeList：点赞用户id列表，List(String)
- reference：引用的评论id，List(String)