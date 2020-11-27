daemonit-ci
===========

![Daemonit Logo](.media/daemonit_logo_full_600x151.png?raw=true)


Docker image: [daemonit/daemonit-ci](https://hub.docker.com/repository/docker/daemonit/daemonit-ci)


What is Daemonit?
-----------------

[Daemonit](https://daemonit.com) is a SaaS for website audit and monitoring.


How to use this image?
----------------------

### Start an audit

```
docker run -e DAEMONIT_API_USER=my@user.com -e DAEMONIT_API_PASS=myPassWord -e DAEMONIT_URL='https://mysite.tld' -e DAEMONIT_ENGINE_ID=6 daemonit/daemonit-ci:latest
```

### Environment Variables


#### DAEMONIT_API_USER

Your username

#### DAEMONIT_API_PASS

Your password

#### DAEMONIT_URL

Website URL target

#### DAEMONIT_ENGINE_ID

Engine used to perform the audit. Please check [engine page](http://app.daemonit.com/infos/engines) to search the best engine for your usage.
Default is `6` (France).
