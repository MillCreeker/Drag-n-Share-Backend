# [Drag-n-Share](https://drag-n-share.com)
## About
I’m pretty sure you already know what the deal is, if not, check [this](https://drag-n-share.com/about/) out.
It’s important to mention that – if you use any of this code – it is only allowed under the [GNU license](https://www.gnu.org/licenses/gpl-3.0.en.html).\
Source-Code

## Points of Interest
I used [Supabase](https://supabase.com/) for the backend, which is simply **amazing**. It allowed me to migrate my existing code more easily than any other service that I know of (or have used).

### Database
There are 3 tables used for this project:
- data
- access
- lock-entries

The column names and their data types are listed below.

#### data
- id: uuid (primary key)
- name: text
- data: text
- timestamp: timestamp
- is-text-only: boolean

#### access
- data-id: uuid (foreign key)
- token: text
- access-key: text

#### lock-entries
- data-id: uuid (foreign key)

## Frontend
Check out the frontend repository [here](https://github.com/MillCreeker/Drag-n-Share-Frontend)