'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('recorridos', 'distancia_estimada_km', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('recorridos', 'distancia_real_km', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.bulkUpdate(
      'recorridos',
      {
        distancia_estimada_km: Sequelize.literal(
          'NULLIF(distancia_total_km, 0)',
        ),
      },
      {},
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('recorridos', 'distancia_real_km');
    await queryInterface.removeColumn('recorridos', 'distancia_estimada_km');
  },
};
