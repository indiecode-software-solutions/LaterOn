import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { getContactDisplayName } from './contactUtils';

const CalendarView = ({ schedules, contacts, onEventDrop, onEventClick, onEventHover }) => {
  const [viewType, setViewType] = useState(() => {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
    return isMobile ? 'listMonth' : 'dayGridMonth';
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setViewType(isMobile ? 'listMonth' : 'dayGridMonth');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Convert schedules to FullCalendar events
  const events = schedules.map(s => {
    const contactName = getContactDisplayName(contacts, s.phone);
    const isPending = s.status === 'pending' || s.status === 'failed';
    const isEmail = s.channel === 'email';
    const channelIcon = isEmail ? '\u2709\uFE0F' : '\uD83D\uDCAC';

    const startTime = s.scheduled_at || s.scheduledAt;
    const endTime = new Date(new Date(startTime).getTime() + 60 * 1000).toISOString();

    return {
      id: s.id,
      title: `${channelIcon} ${isEmail ? (s.email_to || contactName) : contactName}`,
      start: startTime,
      end: endTime,
      backgroundColor: isEmail
        ? (isPending ? '#ea4335' : '#b31412')
        : (isPending ? 'var(--primary)' : 'var(--primary-dark)'),
      borderColor: isEmail
        ? (isPending ? '#ea4335' : '#b31412')
        : (isPending ? 'var(--primary)' : 'var(--primary-dark)'),
      textColor: '#fff',
      extendedProps: { ...s, contactName }
    };
  });

  const handleEventDrop = (info) => {
    const { event } = info;
    const newDate = event.start.toISOString();
    onEventDrop(event.id, newDate);
  };

  const handleEventClick = (info) => {
    const scheduleId = info.event.id;
    const schedule = schedules.find(s => String(s.id) === String(scheduleId));
    if (schedule) {
      onEventClick(schedule);
    }
  };
  const handleEventMouseEnter = (info) => {
    const scheduleId = info.event.id;
    const schedule = schedules.find(s => String(s.id) === String(scheduleId));
    if (schedule && onEventHover) {
      onEventHover(schedule);
    }
  };

  const handleEventMouseLeave = () => {
    if (onEventHover) {
      onEventHover(null);
    }
  };

  return (
    <div
      className="calendar-wrapper"
      style={{
        background: '#fff',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
        border: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <FullCalendar
        key={viewType}
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        initialView={viewType}
        headerToolbar={{
          left: 'title',
          center: '',
          right: 'today prev,next'
        }}
        events={events}
        editable={true}
        droppable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={handleEventMouseLeave}
        height="100%"
        eventDragMinDistance={5}
        dragRevertDuration={0}
        displayEventEnd={false}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
      />
    </div>
  );
};

export default CalendarView;
