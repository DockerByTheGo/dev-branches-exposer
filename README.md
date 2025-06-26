Just like vercel dev branches but self hosted and stanalne without extra baggage

# How it works

1. you need to setup a webhook in your project and point to wherever your server lives

2. write a config.ts file which decides whether or not to deploy a new dev branch using the current commit 


# Notes

Selecting the dockerfile 

by default we will recursively search all of your project for a dockerfile up to 3 levels and then cache it for future iterations (if the cache misses we perform it again) but you can also instead of returning an empty string in `config.ts` return a string which is a local path for the `Dockerfile` location




# Neshta po razrabotka
1.1 Целта на проекта 

Проектът dev-branches-exposer има за цел да автоматизира процеса по разгъване на development бранчове от GitHub като самостоятелни, изолирани среди. Всеки път когато се създаде нов бранч или се направи push към съществуващ, системата автоматично създава среда чрез Docker, достъпна за тестване и преглед.

1.2 Основните функционалности 

Като разработчик, искам всеки dev-branch да се разгръща автоматично, за да мога да го преглеждам и тествам изолирано.

Като QA специалист, искам да имам достъп до URL адреси за всяка активна dev среда, за да извършвам тестване преди сливане.

Като администратор, искам да управлявам кои бранчове се излагат чрез конфигурационен файл или webhook, за да поддържам контрол върху ресурсите.

Като DevOps инженер, искам процесът по разгръщане да е автоматизиран с Docker, за да гарантирам бърза и надеждна интеграция.

1.3 Основните потребители и начина им на работа 
Use Case 1: Push към нов dev-branch

Actor: Developer

Trigger: Push към feature/x

Flow:

Webhook приема заявка

Проверява се за Dockerfile

Създава се нов контейнер

Генерира се достъпен URL

Use Case 2: Изключване на бранч

Actor: Admin

Trigger: Промяна в config.ts

Flow:

Бранчът се изключва от наблюдение

Спира се съответният контейнер

🏗️ 2. Избор на технологии и софтуерна архитектура 

2.1 Избраните технологии 

TypeScript – осигурява стабилност и типизация при разработка.

Node.js – за лек и бърз HTTP сървър, подходящ за webhook обработка.

Docker – основна технология за изолиране и разгръщане на branch среди.

GitHub Webhooks/Token – използва се за интеграция с GitHub събития.



---

2.2  софтуерна архитектура

Проектът използва модулна архитектура с separation of concerns – всеки модул отговаря за отделна задача:

core: логика за откриване на Dockerfile и създаване на среди

config: конфигурация на системата

webhook handler: приема и валидира заявки
Това позволява лесно разширение и поддръжка.



---

2.3 Приложението е разделено на модули/компоненти с описана връзка между тях (4 т.)

config.ts: определя правила за включване на бранчове

core.ts: централен логически модул

handlers/: HTTP webhook вход

admin-panel/: основа за UI управление (в процес)
Диаграма (може да се приложи):


[GitHub Webhook] → [Webhook Handler] → [Core Logic] → [Docker Engine]
                                                  ↑
                                        [Config Rules]


---

2.4 бъдещо разширение 

Възможност за добавяне на нови deployment backends (напр. Kubernetes). Също хоризонтарно скариране лесно може да се постигне тъй като това къде webhook req бива handlenat може да се скрие зад load balancer

Възможност за добавяне на UI за управление на активни среди.

Всеки компонент е слабо свързан и може да бъде заменен или модифициран.
