<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## RouteMind authentication and roles

The API uses an HTTP-only `routeMindToken` cookie. Copy `.env.example` to
`.env` and configure the database, `FRONTEND_ORIGIN`, and a `JWT_SECRET` with
at least 32 characters. To generate a secret locally, run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Apply the database migrations from this directory before starting the API:

```bash
npx sequelize-cli db:migrate
npm run start:dev
```

Set both `SEED_SUPERADMIN_EMAIL` and `SEED_SUPERADMIN_PASSWORD` in `.env` to
create the initial `SUPERADMIN` account when the API starts for the first time.
The password must have at least 12 characters. Do not commit `.env`. Public
registration always creates a `PLANIFICADOR`; only the `SUPERADMIN` can change
user roles, activate/deactivate users, or delete users.

`FRONTEND_ORIGIN` accepts a comma-separated allowlist. For mobile GPS testing
on a local network, include the exact frontend origin used by the phone, such
as `http://192.168.1.20:5174`, and restart the API. The frontend defaults to
the API at the same hostname on port `3000`; set `VITE_API_URL` if the API is
hosted elsewhere.

To make the Vite development server reachable from the phone, start it with
`npm run dev -- --host 0.0.0.0`, then use the computer's LAN address instead
of `localhost`.

| Role | Permissions |
| --- | --- |
| `SUPERADMIN` | Manage vehicles and drivers, plan routes, and manage users and roles |
| `ADMIN` | Manage vehicles and drivers, and plan routes |
| `PLANIFICADOR` | View vehicles and drivers, and manage orders and routes |
| `VIEWER` | Read-only access to the planner and vehicle/driver data |

Only `SUPERADMIN` and `ADMIN` can access `/dashboard`; other signed-in users
are redirected to `/planner`.

### Driver GPS

An `ADMIN` or `SUPERADMIN` creates a driver account from the conductor record,
then assigns that driver to a vehicle. The driver signs in on the phone and
opens `/driver`. Starting the assigned route requests the phone's location;
the browser must grant permission. While the route is active, location updates
are sent every 10 seconds (or when the browser reports a new position), and
the planning map refreshes every 10 seconds. Arrivals are recorded within
100 metres of an undelivered stop; departure is recorded after leaving a
150-metre radius. GPS distance is accumulated separately from the OSRM estimate
and ignores low-accuracy or implausible samples.

The driver must keep the page open and the phone online. Mobile browsers may
pause location updates when the screen is locked or the page is backgrounded.
Geolocation is only available in a secure browser context: HTTPS is required
on a phone (plain HTTP is generally allowed only on localhost). For local
phone testing, serve the frontend and API over HTTPS with a certificate trusted
by that phone, or use a deployed HTTPS environment. Use the phone's LAN
address instead of `localhost`, and allow that exact frontend origin in
`FRONTEND_ORIGIN`.

Apply the GPS tracking migration after reviewing its schema changes:

```bash
npx sequelize-cli db:migrate
```

### OwnTracks HTTP tracking

OwnTracks can send background location updates directly to the API while a
driver has an active route. The driver account must be assigned to the vehicle.
Use a publicly reachable HTTPS API URL (not `localhost`) in OwnTracks HTTP mode:

```text
https://<API_HOST>/api/seguimiento/owntracks/<VEHICLE_ID>
```

Set HTTP Basic authentication to the driver's RouteMind email and password.
In OwnTracks, configure the device's HTTP connection to use those credentials,
then allow background location access and enable location publishing. Start the
vehicle's route in RouteMind before testing; updates are accepted only while
that route is active and only for a vehicle assigned to the authenticated
driver. Location messages update the vehicle's current GPS position, real
distance, and stop arrival/departure tracking. Other OwnTracks message types
are ignored.

Use HTTPS because OwnTracks sends the driver's password using HTTP Basic
authentication. Do not expose the API over plain HTTP on a public network.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
